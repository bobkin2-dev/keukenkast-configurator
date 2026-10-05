import { useState, useCallback, useRef } from 'react';
import {
  defaultBovenkast,
  defaultKolomkast,
  defaultOnderkast,
  defaultLadekast,
  defaultVrijeKast,
  defaultCustomKast
} from '../data/defaultMaterials';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const useKabinet = ({ initialData, addNotification }) => {
  // Cabinets list
  const [kastenLijst, setKastenLijst] = useState(
    initialData?.cabinets?.map(c => c.config) || []
  );

  // Current cabinet state
  const [huidigKast, setHuidigKast] = useState({
    type: 'Bovenkast',
    hoogte: 600,
    breedte: 600,
    diepte: 350,
    aantalLeggers: 2,
    aantalLades: 0,
    aantalDeuren: 1,
    aantalTussensteunen: 0
  });

  // Individual cabinet states
  const [bovenkast, setBovenkast] = useState(defaultBovenkast);
  const [kolomkast, setKolomkast] = useState(defaultKolomkast);
  const [onderkast, setOnderkast] = useState(defaultOnderkast);
  const [ladekast, setLadekast] = useState(defaultLadekast);
  const [vrijeKast, setVrijeKast] = useState(defaultVrijeKast);
  const [customKast, setCustomKast] = useState(defaultCustomKast);

  // Add cabinet function
  const voegKastToe = useCallback((kastData) => {
    const nieuweKast = {
      ...kastData,
      id: generateId(),
      timestamp: new Date().toLocaleString()
    };
    setKastenLijst(prev => [...prev, nieuweKast]);

    const dimensions = `${kastData.hoogte}×${kastData.breedte}×${kastData.diepte}`;
    addNotification(`${kastData.type} toegevoegd - ${dimensions}`);
  }, [addNotification]);

  // Add side panel from existing cabinet
  const voegZijpaneelToe = useCallback((kast) => {
    const zijpaneel = {
      type: `Zijpaneel (${kast.type})`,
      hoogte: kast.hoogte,
      breedte: kast.diepte,
      diepte: 18,
      aantalLeggers: 0,
      aantalLades: 0,
      aantalDeuren: 0,
      aantalTussensteunen: 0,
      id: generateId(),
      timestamp: new Date().toLocaleString(),
      isZijpaneel: true,
      parentId: kast.id
    };
    setKastenLijst(prev => [...prev, zijpaneel]);

    const dimensions = `${zijpaneel.hoogte}×${zijpaneel.breedte}×${zijpaneel.diepte}`;
    addNotification(`Zijpaneel (${kast.type}) toegevoegd - ${dimensions}`, 'bg-amber-500');
  }, [addNotification]);

  // Add side panel from cabinet type config
  const voegZijpaneelToeVoorType = useCallback((type, config) => {
    const zijpaneel = {
      type: `Zijpaneel ${type}`,
      hoogte: config.hoogte,
      breedte: config.diepte,
      diepte: 18,
      aantalLeggers: 0,
      aantalLades: 0,
      aantalDeuren: 0,
      aantalTussensteunen: 0,
      id: generateId(),
      timestamp: new Date().toLocaleString(),
      isZijpaneel: true
    };
    setKastenLijst(prev => [...prev, zijpaneel]);

    const dimensions = `${zijpaneel.hoogte}×${zijpaneel.breedte}×${zijpaneel.diepte}`;
    addNotification(`Zijpaneel ${type} toegevoegd - ${dimensions}`, 'bg-amber-500');
  }, [addNotification]);

  // Copy cabinet
  const kopieerKast = useCallback((kast) => {
    const kopie = {
      ...kast,
      id: generateId(),
      timestamp: new Date().toLocaleString()
    };
    setKastenLijst(prev => [...prev, kopie]);

    const dimensions = `${kast.hoogte}×${kast.breedte}×${kast.diepte}`;
    addNotification(`${kast.type} gekopieerd - ${dimensions}`);
  }, [addNotification]);

  // Update cabinet in-place
  const updateKast = useCallback((id, updates, { silent = false } = {}) => {
    setKastenLijst(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
    if (!silent) addNotification('Kast bijgewerkt', 'bg-blue-500');
  }, [addNotification]);

  // Remove cabinet — with an "Ongedaan maken" toast that puts it back at the same position
  const kastenLijstRef = useRef(kastenLijst);
  kastenLijstRef.current = kastenLijst;

  const verwijderKast = useCallback((id) => {
    const index = kastenLijstRef.current.findIndex(k => k.id === id);
    if (index === -1) return;
    const kast = kastenLijstRef.current[index];
    setKastenLijst(prev => prev.filter(k => k.id !== id));

    const herstel = () => setKastenLijst(prev => {
      if (prev.some(k => k.id === kast.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, kast);
      return next;
    });
    addNotification(
      `#${index + 1} ${kast.type}${kast.naam ? ` – ${kast.naam}` : ''} verwijderd`,
      'bg-gray-700',
      { duration: 8000, action: { label: 'Ongedaan maken', onClick: herstel } }
    );
  }, [addNotification]);

  return {
    kastenLijst, setKastenLijst,
    huidigKast, setHuidigKast,
    bovenkast, setBovenkast,
    kolomkast, setKolomkast,
    onderkast, setOnderkast,
    ladekast, setLadekast,
    vrijeKast, setVrijeKast,
    customKast, setCustomKast,
    voegKastToe,
    voegZijpaneelToe,
    voegZijpaneelToeVoorType,
    kopieerKast,
    updateKast,
    verwijderKast
  };
};
