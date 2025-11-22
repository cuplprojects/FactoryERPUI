import React, { useEffect, useState } from 'react';
import { Button, Offcanvas, Accordion, Table } from 'react-bootstrap';
import { MdNotifications, MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from './../../store/themeStore';
import useProjectMap from './../../CustomHooks/ApiServices/useProjectMap';
import axios from 'axios';
import API from './../../CustomHooks/MasterApiHooks/api';

const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

const NoticeBoard = ({ show, onHide, dispatchData }) => {
    const { t } = useTranslation();
    const { getCssClasses } = useStore(themeStore);
    const [customDark, , customLight, , customDarkText, customLightText, customLightBorder] = getCssClasses();
    const { projectMap, groupMap, typeMap } = useProjectMap();
    const [dailyTasks, setDailyTasks] = useState([]);

    // Fetch Daily Tasks
    useEffect(() => {

        API.get(`/Reports/UnderProduction`)
            .then(res => { console.log(res.data); setDailyTasks(res.data) })
            .catch(err => console.error('Error fetching daily production report:', err));
    }, []);


    const todayDisplay = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Offcanvas
            show={show}
            onHide={onHide}
            placement="end"
            className={`${customLight}`}
            style={{ width: '95vw', maxWidth: '1200px' }}
        >
            <div className={`${customLightBorder} d-flex justify-content-between align-items-center mt-4`}>
                <div className="d-flex align-items-center">
                    <Button
                        onClick={onHide}
                        className={`${customDark} border-0 p-0 m-0`}
                        aria-label="Close"
                    >
                        <MdClose size={24} />
                    </Button>
                    <h4 className='mb-0 ms-2 '>{t("todaysTasks")}:</h4>
                </div>
                <h4 className='mb-0 me-3 '>{todayDisplay}</h4>
            </div>

            <Offcanvas.Body style={{ overflowX: 'auto' }}>
                <Accordion defaultActiveKey={['0']} alwaysOpen>

                    {/* Dispatch Today */}
                    {dispatchData?.dispatches?.length > 0 && (
                        <Accordion.Item eventKey="0">
                            <Accordion.Header className="fs-5">
                                <strong>Dispatch Today</strong>
                            </Accordion.Header>
                            <Accordion.Body>
                                <Table striped bordered hover responsive className="text-wrap" style={{ whiteSpace: 'normal' }}>
                                    <thead>
                                        <tr>
                                            <th>Group</th>
                                            <th>Project</th>
                                            <th>Lot</th>
                                            <th>Type</th>
                                            {/* <th>Dispatch Date</th> */}
                                            <th>Exam From</th>
                                            <th>Exam To</th>
                                            <th>Count</th>
                                            <th>Qty</th>
                                            {/*<th>Box Count</th>*/}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dispatchData.dispatches.map(task => {
                                            const projectInfo = projectMap[task.projectId];
                                            const projectName = projectInfo?.name || 'Unknown Project';
                                            const groupName = groupMap[projectInfo?.groupId] || 'Unknown Group';
                                            const typeName = typeMap[projectInfo?.typeId] || 'Unknown Type';

                                            const summary = task.quantitySheetSummary || {};

                                            return (
                                                <tr key={`${task.projectId}-${task.lotNo}`}>
                                                    <td>{groupName}</td>
                                                    <td>{projectName}</td>
                                                    <td>{task.lotNo}</td>
                                                    <td>{typeName}</td>
                                                    {/* <td>{formatDate(task.dispatchDate)}</td> */}
                                                    <td>{formatDate(summary.examFrom)}</td>
                                                    <td>{formatDate(summary.examTo)}</td>
                                                    <td>{summary.totalCatches || 0}</td>
                                                    <td>{summary.totalQuantity || 0}</td>
                                                   {/* <td>{task.boxCount}</td> */} 
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Accordion.Body>
                        </Accordion.Item>
                    )}

                    {/* Daily Task */}
                    {dailyTasks.length > 0 && (
                        <Accordion.Item eventKey="1">
                            <Accordion.Header className="fs-5">
                                <strong>Daily Task</strong>
                            </Accordion.Header>
                            <Accordion.Body>
                                <Table striped bordered hover responsive className="text-wrap" style={{ whiteSpace: 'normal' }}>
                                    <thead>
                                        <tr>
                                            <th>Group</th>
                                            <th>Project</th>
                                            <th>Lot</th>
                                            <th>Type</th>
                                            <th>Exam From</th>
                                            <th>Exam To</th>
                                            <th>Count</th>
                                            <th>Qty</th>
                                            <th>Dispatch Date</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyTasks.map(task => {
                                            const projectInfo = projectMap[task.projectId];
                                            const projectName = projectInfo?.name || 'Unknown Project';
                                            const groupName = groupMap[projectInfo?.groupId] || 'Unknown Group'
                                            const typeName = typeMap[task.typeId] || 'Unknown Type';

                                            return (
                                                <tr key={`${task.projectId}-${task.lotNo}`}>
                                                    <td>{groupName}</td>
                                                    <td>{projectName}</td>
                                                    <td>{task.lotNo}</td>
                                                    <td>{typeName}</td>
                                                    <td>{formatDate(task.fromDate)}</td>
                                                    <td>{formatDate(task.toDate)}</td>
                                                    <td>{task.totalCatchNo}</td>
                                                    <td>{task.totalQuantity}</td>
                                                    <td>{task.dispatchDate}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Accordion.Body>
                        </Accordion.Item>
                    )}

                </Accordion>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

const NoticeBoardButton = ({ onClick, showNoticeBoard, customDark, customLightText, style = {} }) => {
    return (
        <Button
            onClick={onClick}
            className={`${customDark} ${customLightText} rounded-5 border-0 d-flex align-items-center`}
            style={style}
        >
            {showNoticeBoard ? (
                <MdClose size={20} />
            ) : (
                <MdNotifications size={20} />
            )}
        </Button>
    );
};

export { NoticeBoard, NoticeBoardButton };
