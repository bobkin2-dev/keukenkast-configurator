import { useState, useMemo, useEffect } from 'react';
import { defaultPlaatMaterialen, getMateriaalVoor } from '../data/defaultMaterials';
import { supabase } from '../lib/supabase';

export const useMaterials = (initialData) => {
  // Unified plate materials (single source of truth)
  const [plaatMaterialen, setPlaatMaterialen] = useState(defaultPlaatMaterialen);

  // Derived material lists sorted by popular use (popular first, then others)
  const materiaalBinnenkast = useMemo(() => getMateriaalVoor(plaatMaterialen, 'binnenkast').all, [plaatMaterialen]);
  const materiaalBuitenzijde = useMemo(() => getMateriaalVoor(plaatMaterialen, 'buitenzijde').all, [plaatMaterialen]);
  const materiaalTablet = useMemo(() => getMateriaalVoor(plaatMaterialen, 'tablet').all, [plaatMaterialen]);

  // Selected materials
  const [geselecteerdMateriaalBinnen, setGeselecteerdMateriaalBinnen] = useState(0);
  const [geselecteerdMateriaalBuiten, setGeselecteerdMateriaalBuiten] = useState(0);
  const [geselecteerdMateriaalTablet, setGeselecteerdMateriaalTablet] = useState(0);

  // Efficiency percentages
  const [rendementBinnenzijde, setRendementBinnenzijde] = useState(75);
  const [rendementBuitenzijde, setRendementBuitenzijde] = useState(70);

  // Price adjustment panels
  const [showPrijsAanpassing, setShowPrijsAanpassing] = useState({
    binnen: false,
    buiten: false,
    tablet: false
  });

  // Alternative materials
  const [alternatieveMateriaal, setAlternatieveMateriaal] = useState({
    ruggenGebruiken: false,
    ruggenMateriaal: 0,
    leggersGebruiken: false,
    leggersMateriaal: 0
  });

  // Material price update function - updates the unified plaatMaterialen
  const updateMateriaalPrijs = (type, index, field, value) => {
    const materials = {
      binnen: materiaalBinnenkast,
      buiten: materiaalBuitenzijde,
      tablet: materiaalTablet
    };

    const targetMat = materials[type]?.[index];
    if (!targetMat) return;

    setPlaatMaterialen(prev => prev.map(mat => {
      if (mat.id === targetMat.id || (mat.naam === targetMat.naam && mat.afmeting === targetMat.afmeting)) {
        if (field === 'prijs') {
          return { ...mat, prijs: parseFloat(value) || 0 };
        } else if (field === 'breedte' || field === 'hoogte') {
          const newVal = parseInt(value) || 0;
          return {
            ...mat,
            [field]: newVal,
            afmeting: `${field === 'breedte' ? newVal : mat.breedte} x ${field === 'hoogte' ? newVal : mat.hoogte}`
          };
        }
      }
      return mat;
    }));
  };

  // Load from initialData
  const restoreSettings = (s) => {
    if (s.plaatMaterialen) setPlaatMaterialen(s.plaatMaterialen);
    if (s.geselecteerdMateriaalBinnen !== undefined) setGeselecteerdMateriaalBinnen(s.geselecteerdMateriaalBinnen);
    if (s.geselecteerdMateriaalBuiten !== undefined) setGeselecteerdMateriaalBuiten(s.geselecteerdMateriaalBuiten);
    if (s.geselecteerdMateriaalTablet !== undefined) setGeselecteerdMateriaalTablet(s.geselecteerdMateriaalTablet);
    if (s.rendementBinnenzijde) setRendementBinnenzijde(s.rendementBinnenzijde);
    if (s.rendementBuitenzijde) setRendementBuitenzijde(s.rendementBuitenzijde);
    if (s.alternatieveMateriaal) setAlternatieveMateriaal(s.alternatieveMateriaal);
  };

  // Load plate materials from Supabase
  useEffect(() => {
    const loadPlaatMaterialen = async () => {
      try {
        const { data, error } = await supabase
          .from('plaat_materialen')
          .select('*')
          .order('id', { ascending: true });

        if (data && !error && data.length > 0) {
          setPlaatMaterialen(data);
        }
      } catch (err) {
        console.log('Using default plate materials');
      }
    };
    loadPlaatMaterialen();
  }, []);

  return {
    plaatMaterialen, setPlaatMaterialen,
    materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet,
    geselecteerdMateriaalBinnen, setGeselecteerdMateriaalBinnen,
    geselecteerdMateriaalBuiten, setGeselecteerdMateriaalBuiten,
    geselecteerdMateriaalTablet, setGeselecteerdMateriaalTablet,
    rendementBinnenzijde, setRendementBinnenzijde,
    rendementBuitenzijde, setRendementBuitenzijde,
    showPrijsAanpassing, setShowPrijsAanpassing,
    alternatieveMateriaal, setAlternatieveMateriaal,
    updateMateriaalPrijs,
    restoreSettings
  };
};
