import React, { useState, useEffect } from 'react';
import { Button, Tag, Checkbox, Input, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { decrypt } from '../Security/Security';
import API from '../CustomHooks/MasterApiHooks/api';
import { useStore } from 'zustand';
import themeStore from '../store/themeStore';
import { Modal as BootstrapModal } from 'react-bootstrap';


const CatchMergeModal = ({ visible, onClose, catches, onCatchesChange, selectedLotNo, fetchQuantity, dispatchedLots = [] }) => {
    const { t } = useTranslation();
    const { encryptedProjectId } = useParams();
    const projectId = decrypt(encryptedProjectId);
    const [projectName, setProjectName] = useState('');
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText] = cssClasses;
    const [delimiter, setDelimiter] = useState('/');
    const [innerEnvelope, setInnerEnvelope] = useState('');
    const [outerEnvelope, setOuterEnvelope] = useState('');

    useEffect(() => {
        const fetchProjectName = async () => {
            try {
                const response = await API.get(`/Project/${projectId}`);
                setProjectName(response.data.name);
            } catch (error) {
                console.error(t('failedToFetchProjectName'), error);
            }
        };

        if (visible) {
            fetchProjectName();
        }
    }, [projectId, visible, dispatchedLots]);

    const handleMergeCatch = async () => {
        try {
            if (!selectedLotNo) {
                return;
            }

            const payload = {
                projectId: Number(projectId),
                CatchNos: catches.map(c => c.catchNo),
                delimiter: delimiter,
                innerEnvelope: innerEnvelope,
                outerEnvelope: outerEnvelope
            };

            const response = await API.post('/QuantitySheet/MergeCatch', payload);
            if (response && response.status === 201) {
                try {
                    await fetchQuantity();
                } catch (fetchError) {
                    console.error('Error fetching updated quantity:', fetchError);
                }
                resetModal();
            }
            resetModal();
        } catch (error) {
            console.error('Merge failed:', error);
            resetModal();
        }
    };

    const resetModal = () => {
        setDelimiter('/')
        setInnerEnvelope('')
        setOuterEnvelope('')
        onClose();
        fetchQuantity();
    };

    const handleTagClose = (catchItem) => {
        const updatedCatches = catches.filter(item => item.id !== catchItem.id);
        onCatchesChange(updatedCatches);
        if (updatedCatches.length === 0) {
            onClose();
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <BootstrapModal show={visible} onHide={resetModal} className={`${customDark === "dark-dark" ? "" : ""}`}>
            <BootstrapModal.Header closeButton={false} className={customDark}>
                <BootstrapModal.Title className={customLightText}>
                    {t('mergeCatches')} : {projectName}
                </BootstrapModal.Title>
            </BootstrapModal.Header>
            <BootstrapModal.Body className={customLight}>
                <div className="mb-4">
                    <div className="mb-3">
                        <label className={`${customDarkText} mb-2`}> {t('selectedCatchesWillBeMerged')}:</label>
                        <div className="d-flex flex-wrap gap-2">
                            {catches.map(catchItem => (
                                <Tag
                                    key={catchItem.id}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        handleTagClose(catchItem);
                                    }}
                                    className={`${customMid} ${customDarkText} fs-6`}
                                >
                                    {catchItem.catchNo}
                                </Tag>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="row mb-3">
                    <div className='col-md-2 col-sm-8 mb-2' >
                        <label className={`${customDarkText} mb-1`}>Delimiter</label>
                        <Input
                            placeholder="Enter delimiter (e.g., -, /, _ )"
                            value={delimiter}
                            onChange={(e) => setDelimiter(e.target.value)}
                        />
                    </div>

                    <div className='col-md-6 col-sm-16 mb-2'>
                        <label className={`${customDarkText} mb-1`}>Inner Envelope</label>
                        <Input
                            placeholder="Enter inner envelope"
                            value={innerEnvelope}
                            onChange={(e) => setInnerEnvelope(e.target.value)}
                        />
                    </div>

                    <div className='col-md-4 col-sm-12 mb-2'>
                        <label className={`${customDarkText} mb-1`}>Outer Envelope</label>
                        <InputNumber
                            placeholder="Enter outer envelope"
                            value={outerEnvelope}
                            onChange={(value) => setOuterEnvelope(value)}
                            onKeyDown={(e) => {
                                const isLetter = /^[a-zA-Z]$/.test(e.key);
                                if (isLetter) {
                                    e.preventDefault();
                                }
                            }}

                            style={{ width: "100%" }}
                        />
                    </div>
                </div>
            </BootstrapModal.Body>
            <BootstrapModal.Footer className={customDark}>
                <Button onClick={resetModal} className={`${customBtn}`}>{t('cancel')}</Button>
                <Button
                    onClick={handleMergeCatch}
                    disabled={!selectedLotNo}
                    className={`${customBtn}`}
                >
                    {t('merge')}
                </Button>
            </BootstrapModal.Footer>
        </BootstrapModal>
    );
};

export default CatchMergeModal;
