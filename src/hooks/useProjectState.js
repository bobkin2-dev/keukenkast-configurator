import { useState, useEffect, useRef, useCallback } from 'react';
import { db, supabase } from '../lib/supabase';
import { DEFAULT_PRODUCTION_PARAMS } from '../components/Admin/AdminSettings';

export const useProjectState = ({
  projectId,
  initialData,
  materials,
  kastenLijst,
  projectInfo,
  accessoires,
  extraBeslag,
  arbeidParameters,
  keukentoestellen,
  extraAmounts,
  priceOverrides,
  arbeidOverrides,
  customBeslag,
  customPlaatmateriaal,
  customPlaatRequests,
  nestingMode,
  nestingBuffer,
  tabletsteun,
  infoOverrides,
  customProjectMaterialen,
  materiaalPrijsLocks,
  setAccessoires,
  setExtraBeslag,
  setArbeidParameters,
  setKeukentoestellen,
  setExtraAmounts,
  setPriceOverrides,
  setArbeidOverrides,
  setCustomBeslag,
  setCustomPlaatmateriaal,
  setCustomPlaatRequests,
  setNestingMode,
  setNestingBuffer,
  setTabletsteun,
  setInfoOverrides,
  setCustomProjectMaterialen,
  setMateriaalPrijsLocks,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [productionParams, setProductionParams] = useState(DEFAULT_PRODUCTION_PARAMS);
  const autoSaveTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  // Mark as having unsaved changes when data changes
  useEffect(() => {
    if (projectId) {
      setHasUnsavedChanges(true);
    }
  }, [kastenLijst, projectInfo, accessoires, extraBeslag, keukentoestellen, materials.rendementBinnenzijde, materials.rendementBuitenzijde, extraAmounts, priceOverrides, arbeidOverrides, customBeslag, customPlaatmateriaal, customPlaatRequests, nestingMode, nestingBuffer, tabletsteun, infoOverrides, customProjectMaterialen, materiaalPrijsLocks]);

  // Save project function
  const handleSave = useCallback(async () => {
    if (!projectId || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);

    const settings = {
      plaatMaterialen: materials.plaatMaterialen,
      geselecteerdMateriaalBinnen: materials.geselecteerdMateriaalBinnen,
      geselecteerdMateriaalBuiten: materials.geselecteerdMateriaalBuiten,
      geselecteerdMateriaalTablet: materials.geselecteerdMateriaalTablet,
      rendementBinnenzijde: materials.rendementBinnenzijde,
      rendementBuitenzijde: materials.rendementBuitenzijde,
      accessoires,
      extraBeslag,
      arbeidParameters,
      keukentoestellen,
      alternatieveMateriaal: materials.alternatieveMateriaal,
      extraAmounts,
      priceOverrides,
      arbeidOverrides,
      customBeslag,
      customPlaatmateriaal,
      customPlaatRequests,
      nestingMode,
      nestingBuffer,
      tabletsteun,
      infoOverrides,
      customProjectMaterialen,
      materiaalPrijsLocks,
      aantal: projectInfo.aantal || 1,
    };

    const { error } = await db.saveProjectState(projectId, projectInfo, settings, kastenLijst);

    if (error) {
      console.error('Autosave fout:', error.message);
    } else {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }

    setIsSaving(false);
    isSavingRef.current = false;
  }, [projectId, materials, accessoires, extraBeslag, arbeidParameters, keukentoestellen, projectInfo, kastenLijst, extraAmounts, priceOverrides, arbeidOverrides, customBeslag, customPlaatmateriaal, customPlaatRequests, nestingMode, nestingBuffer, tabletsteun, infoOverrides, customProjectMaterialen, materiaalPrijsLocks]);

  // Debounced autosave: 5 seconds after last change
  useEffect(() => {
    if (!hasUnsavedChanges || !projectId) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => handleSave(), 5000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [hasUnsavedChanges, kastenLijst, projectInfo, accessoires, extraBeslag, keukentoestellen, handleSave, projectId, extraAmounts, priceOverrides, arbeidOverrides, customBeslag, customPlaatmateriaal, customPlaatRequests, nestingMode, nestingBuffer, tabletsteun, infoOverrides, customProjectMaterialen, materiaalPrijsLocks]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Load settings from initialData
  useEffect(() => {
    if (initialData?.settings) {
      const s = initialData.settings;
      materials.restoreSettings(s);
      if (s.accessoires) setAccessoires(s.accessoires);
      if (s.extraBeslag) setExtraBeslag(s.extraBeslag);
      if (s.arbeidParameters) setArbeidParameters(s.arbeidParameters);
      if (s.keukentoestellen) setKeukentoestellen(s.keukentoestellen);
      if (s.extraAmounts) setExtraAmounts(s.extraAmounts);
      if (s.priceOverrides) setPriceOverrides(s.priceOverrides);
      if (s.arbeidOverrides) setArbeidOverrides(s.arbeidOverrides);
      if (s.customBeslag) setCustomBeslag(s.customBeslag);
      if (s.customPlaatmateriaal) setCustomPlaatmateriaal(s.customPlaatmateriaal);
      if (s.customPlaatRequests) setCustomPlaatRequests(s.customPlaatRequests);
      if (typeof s.nestingMode === 'boolean') setNestingMode(s.nestingMode);
      if (typeof s.nestingBuffer === 'number') setNestingBuffer(s.nestingBuffer);
      if (s.tabletsteun) setTabletsteun(s.tabletsteun);
      if (s.infoOverrides) setInfoOverrides(s.infoOverrides);
      if (s.customProjectMaterialen) setCustomProjectMaterialen(s.customProjectMaterialen);
      if (s.materiaalPrijsLocks) setMateriaalPrijsLocks(s.materiaalPrijsLocks);
    }
    setHasUnsavedChanges(false);
  }, [initialData]);

  // Load production params from Supabase
  useEffect(() => {
    const loadProductionParams = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('key', 'production_params')
          .single();

        if (data && !error) {
          setProductionParams({ ...DEFAULT_PRODUCTION_PARAMS, ...data.value });
        }
      } catch (err) {
        console.log('Using default production params');
      }
    };
    loadProductionParams();
  }, []);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    handleSave,
    productionParams, setProductionParams
  };
};
