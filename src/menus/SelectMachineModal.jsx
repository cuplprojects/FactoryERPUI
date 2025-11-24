import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Select from 'react-select';
import API from '../CustomHooks/MasterApiHooks/api';
import { useStore } from 'zustand';
import themeStore from '../store/themeStore';
import { useTranslation } from 'react-i18next';

const SelectMachineModal = ({ show, handleClose, data, processId, handleSave }) => {
  const { t } = useTranslation();
  const themeState = useStore(themeStore);
  const cssClasses = useMemo(() => themeState.getCssClasses(), [themeState]);
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText] = cssClasses;

  // Force re-render when theme changes
  useEffect(() => {}, [cssClasses]);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineOptions, setMachineOptions] = useState([]);
  const [machineId, setMachineId] = useState(null);
  const [zoneData, setZoneData] = useState([]); // State to store zone data
  const [selectedZone, setSelectedZone] = useState(null); // State to store selected zone info

  const handleMachineChange = (selectedOption) => {
    setSelectedMachine(selectedOption);
    setMachineId(selectedOption ? selectedOption.value : null);
  
    // Find the associated zone data for the selected machine
    const selectedMachineData = machineOptions.find(machine => machine.value === selectedOption.value);
  
    if (selectedMachineData) {
      // Ensure machineIds is defined and an array before calling .includes
      const associatedZone = zoneData.find(zone => Array.isArray(zone.machineId) && zone.machineId.includes(selectedOption.value));
  
      setSelectedZone(associatedZone || null); // Set selected zone data
    }
  };
  

  const getMachine = async () => {
    try {
      const response = await API.get('/Machines');
      const filteredMachines = response.data.filter(machine => machine.processId === processId);
    

      const machineWithZoneData = filteredMachines.map(machine => ({
        value: machine.machineId,
        label: machine.machineName,
        zoneId: machine.zoneId, // Zone Id in machine data
      }));

      setMachineOptions(machineWithZoneData);
    } catch (error) {
      console.error('Failed to fetch machine options', error);
    }
  };

  const getZoneData = async () => {
    console.log('Fetching zone data...');
    try {
      const response = await API.get('/Zones'); // Fetch zone data
      console.log('Fetched zone response:', response);
      // Sanitize zone data to ensure machineIds is always an array
      const sanitizedZoneData = response.data.map(zone => ({
        ...zone,
        machineIds: Array.isArray(zone.machineIds) ? zone.machineIds : [] // Ensure machineIds is always an array
      }));
      setZoneData(sanitizedZoneData); // Store sanitized zone data
    } catch (error) {
      console.error('Failed to fetch zone data', error);
    }
  };
  

  useEffect(() => {
    getMachine();
    getZoneData();
  }, [show]);

  const handleConfirm = async () => {
    try {
      const updatePromises = data.map(async (row) => {
        let existingTransactionData;
        if (row.transactionId) {
          const response = await API.get(`/Transactions/${row.transactionId}`);
          existingTransactionData = response.data;
        }

        const postData = {
          transactionId: row.transactionId || 0,
          interimQuantity: row.interimQuantity,
          remarks: existingTransactionData ? existingTransactionData.remarks : '',
          projectId: row.projectId,
          quantitysheetId: row.srNo || 0,
          processId: processId,
          zoneId: selectedZone ? selectedZone.zoneId : 0, // Send zoneId from selected zone
          machineId: machineId,
          status: existingTransactionData ? existingTransactionData.status : 0,
          alarmId: existingTransactionData ? existingTransactionData.alarmId : "",
          lotNo: row.lotNo,
          teamId: existingTransactionData ? existingTransactionData.teamId : [],
          voiceRecording: existingTransactionData ? existingTransactionData.voiceRecording : ""
        };

        await API.post('/Transactions', postData);
      });

      await Promise.all(updatePromises);
      handleSave(machineId);
      setMachineId(null);
      setSelectedMachine(null);
      setSelectedZone(null); // Reset zone data after confirmation
      handleClose();
    } catch (error) {
      console.error('Error updating machine:', error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton className={`${customDark} ${customDarkText}`}>
        <Modal.Title className={customLightText}>{t('selectMachine')}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={`${customLight} ${customDarkText}`}>
        {Array.isArray(data) && data.length > 0 ? (
          <>
            <div className="mb-3">
              <span className="fw-bold">{t('selectedCatches')}: </span>
              {data.map(row => row.catchNumber).join(', ')}
            </div>
            <div className='mb-3'>
              <span className='fw-bold'>{t('totalItems')}: </span>
              {data.length}
            </div>
          </>
        ) : (
          <div>{t('noDataAvailable')}</div>
        )}
        <Form.Group controlId="formMachine">
          <Form.Label>{t('selectMachine')}</Form.Label>
          <Select
            value={selectedMachine}
            onChange={handleMachineChange}
            options={machineOptions}
            placeholder={t('selectMachine')}
            isClearable
            className={`${customDarkText}`}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className={`${customLight} ${customDarkText}`}>
        <Button 
          variant="danger" 
          onClick={handleClose}
          className={`${customBtn} border-0`}
        >
          {t('close')}
        </Button>
        <Button 
          onClick={handleConfirm}
          className={`${customBtn} border-0`}
        >
          {t('saveChanges')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectMachineModal;
