import { useState, useCallback } from 'react';
import {
  defaultBovenkast,
  defaultKolomkast,
  defaultOnderkast,
  defaultLadekast,
  defaultVrijeKast,
  defaultCustomKast
} from '../data/defaultMaterials';

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
      id: Date.now(),
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
      id: Date.now(),
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
      id: Date.now(),
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
      id: Date.now(),
      timestamp: new Date().toLocaleString()
    };
    setKastenLijst(prev => [...prev, kopie]);

    const dimensions = `${kast.hoogte}×${kast.breedte}×${kast.diepte}`;
    addNotification(`${kast.type} gekopieerd - ${dimensions}`);
  }, [addNotification]);

  // Remove cabinet
  const verwijderKast = useCallback((id) => {
    setKastenLijst(prev => prev.filter(kast => kast.id !== id));
  }, []);

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
    verwijderKast
  };
};
