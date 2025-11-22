import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Input,
  Checkbox,
  Form,
  Row,
  Col,
  message,
} from "antd";
import { useStore } from "zustand";
import { Modal as BootstrapModal } from "react-bootstrap";
import themeStore from "./../store/themeStore";
import API from "../CustomHooks/MasterApiHooks/api";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decrypt } from "../Security/Security";
import CatchTransferModal from "../menus/CatchTransferModal";
import CatchMergeModal from "../menus/CatchMergeModal";

const ViewQuantitySheet = ({ selectedLotNo, showBtn, showTable, lots }) => {
  const { t } = useTranslation();
  const [modalMessage, setModalMessage] = useState("");
  const { encryptedProjectId } = useParams();
  const projectId = decrypt(encryptedProjectId);
  const [process, setProcess] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [selectedProcessIds, setSelectedProcessIds] = useState([]);
  const [selectedCatches, setSelectedCatches] = useState([]);
  const [quantitySheetId, setQuantitySheetId] = useState(null);
  const [newRowData, setNewRowData] = useState({
    catchNo: "",
    paper: "",
    course: "",
    subject: "",
    innerEnvelope: "",
    outerEnvelope: 0,
    examDate: "",
    examTime: "",
    quantity: 0,
    percentageCatch: 0,
    status: 0,
    projectId: projectId,
    quantitySheetId: quantitySheetId,
    pages: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToStop, setItemToStop] = useState(null);
  const [showNewRow, setShowNewRow] = useState(false);
  const [CTP_ID, setCTP_ID] = useState(null);
  const [OFFSET_PRINTING_ID, setOFFSET_PRINTING_ID] = useState(null);
  const [DIGITAL_PRINTING_ID, setDIGITAL_PRINTING_ID] = useState(null);
  const [CUTTING_ID, setCUTTING_ID] = useState(null);
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [
    customDark,
    customMid,
    customLight,
    customBtn,
    customDarkText,
    customLightText,
    customLightBorder,
    customDarkBorder,
  ] = cssClasses;
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [dispatchedLots, setDispatchedLots] = useState([]);
  const [dates, setDates] = useState([]);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);
  const [editableRowKey, setEditableRowKey] = useState(null); // Track editable row
  const [editedRow, setEditedRow] = useState({}); // Store edited row data

  const columns = [
    {
      title: t("select"),
      dataIndex: "selection",
      key: "selection",
      width: "2%",
      render: (_, record) => {
        const isDispatched = dispatchedLots.includes(selectedLotNo);
        const isDisabled = record.stopCatch === 1;  // Disable if stopCatch is 1
        return (
          <Checkbox
            disabled={isDispatched || isDisabled}
            checked={selectedCatches.some(
              (item) => item.id === record.quantitySheetId
            )}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCatches([
                  ...selectedCatches,
                  {
                    id: record.quantitySheetId,
                    catchNo: record.catchNo,
                    processId: record.processId
                  },
                ]);
              } else {
                setSelectedCatches(
                  selectedCatches.filter(
                    (item) => item.id !== record.quantitySheetId
                  )
                );
              }
            }}
          />
        );
      },
    },
    {
      title: t("catchNo"),
      dataIndex: "catchNo",
      key: "catchNo",
      width: 100,
      sorter: (a, b) => a.catchNo.localeCompare(b.catchNo),
    },
    {
      title: t("paper"),
      dataIndex: "paper",
      key: "paper",
      width: 100,
      sorter: (a, b) => a.paper.localeCompare(b.paper),
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.paper}
              onChange={(e) => handleInputChange("paper", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("course"),
      dataIndex: "course",
      key: "course",
      width: 100,
      sorter: (a, b) => a.course.localeCompare(b.course),
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.course}
              onChange={(e) => handleInputChange("course", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("subject"),
      dataIndex: "subject",
      key: "subject",
      width: 100,
      sorter: (a, b) => a.subject.localeCompare(b.subject),
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("examDate"),
      dataIndex: "examDate",
      key: "examDate",
      width: 100,
      sorter: (a, b) => {
        // Convert DD-MM-YYYY to Date objects for proper comparison
        const [dayA, monthA, yearA] = a.examDate.split("-");
        const [dayB, monthB, yearB] = b.examDate.split("-");

        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);

        return dateA - dateB;
      },
      render: (text, record) => (
        <span>
          {text}
          {record.isExamDateOverlapped && (
            <WarningOutlined style={{ color: "#ff4d4f", marginLeft: "5px" }} />
          )}
        </span>
      ),
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.examDate} // Use the formatted date
              type="date"
              min={minDate}
              max={maxDate}
              onChange={(e) => handleInputChange("examDate", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("examTime"),
      dataIndex: "examTime",
      key: "examTime",
      width: 100,
      sorter: (a, b) => a.examTime.localeCompare(b.examTime),
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.examTime}
              onChange={(e) => handleInputChange("examTime", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("innerEnvelope"),
      dataIndex: "innerEnvelope",
      key: "innerEnvelope",
      width: 100,
      sorter: (a, b) => a.innerEnvelope.localeCompare(b.innerEnvelope),
    },
    {
      title: t("outerEnvelope"),
      dataIndex: "outerEnvelope",
      key: "outerEnvelope",
      width: 100,
      sorter: (a, b) => a.outerEnvelope.localeCompare(b.outerEnvelope),
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.outerEnvelope}
              onChange={(e) => handleInputChange("outerEnvelope", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("quantity"),
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (text, record) => {
        if (editableRowKey === record.key) {
          return (
            <Input
              value={editedRow.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
            />
          );
        }
        return text;
      },
    },
    {
      title: t("pages"),
      dataIndex: "pages",
      key: "pages",
      width: 100,
      sorter: (a, b) => a.pages - b.pages,
    },
    {
      title: t("Process"),
      dataIndex: "processId",
      key: "processId",
      width: 100,
      render: (text) =>
        Array.isArray(text)
          ? text
            .map((id) => process.find((proc) => proc.id === id)?.name)
            .join(", ") || t("notApplicable")
          : t("notApplicable"),
      sorter: (a, b) => {
        const aProcesses = a.processId
          .map((id) => process.find((proc) => proc.id === id)?.name)
          .join(",");
        const bProcesses = b.processId
          .map((id) => process.find((proc) => proc.id === id)?.name)
          .join(",");
        return aProcesses.localeCompare(bProcesses);
      },
    },
    {
      title: t("action"),
      key: "operation",
      fixed: "right",
      width: 150,
      render: (_, record) => {
        const isDispatched = dispatchedLots.includes(selectedLotNo);
        const isDisabled = record.stopCatch === 1;

        return (
          <>

            {editableRowKey === record.key ? (

              <>

                <Button

                  type="primary"

                  onClick={handleSave}

                  style={{ marginRight: 8 }}

                >

                  {t("save")}

                </Button>

                <Button onClick={handleCancel}>{t("cancel")}</Button>

              </>

            ) : (
              <>

                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveButtonClick(record.key)}
                  style={{ marginRight: 8 }}
                  danger
                  disabled={isDispatched || isDisabled}
                />
                <Button
                  icon={<StopOutlined />}
                  onClick={() => handleStopButtonClick(record.key)}
                  style={{ marginRight: 8 }}
                  danger
                  disabled={isDispatched}
                />
                <Button

                  icon={<EditOutlined />}

                  onClick={() => handleCatchEditButton(record)}

                  danger

                  disabled={isDispatched || isDisabled}

                />
              </>
            )}
          </>
        );
      },
    },
  ];

  const getFilteredData = () => {
    if (!searchText) return dataSource;

    return dataSource.filter((record) => {
      return Object.keys(record).some((key) => {
        // Skip processId and other non-string fields
        if (
          key === "processId" ||
          key === "key" ||
          key === "quantitySheetId" ||
          key === "status" ||
          key === "projectId"
        )
          return false;

        const value = record[key];
        if (value === null || value === undefined) return false;

        return value
          .toString()
          .toLowerCase()
          .includes(searchText.toLowerCase());
      });
    });
  };

  const fetchQuantity = async (lotNo = selectedLotNo) => {
    try {
      const response = await API.get(
        `/QuantitySheet/Catches?ProjectId=${projectId}&lotNo=${lotNo}`
      );
      console.log("lot data in qty sheet", response.data);
      const dataWithKeys = response.data.map((item) => ({
        ...item,
        key: item.quantitySheetId,
      }));
      setDataSource(dataWithKeys);


    } catch (error) {
      console.error(t("failedToFetchQuantity"), error);
    }
  };

  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split("-"); // Split the DD-MM-YYYY format
    return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format for Date constructor
  };

  const getAvailableDates = async (lotNo) => {
    try {
      const response = await API.get(
        `/QuantitySheet/exam-dates?projectId=${projectId}&lotNo=${lotNo}`
      );
      console.log("Exam data in quantity sheet", response.data);

      // Convert dates to proper Date objects and sort them
      const availableDates = response.data.map(formatDate);
      const sortedDates = availableDates.sort((a, b) => a - b); // Sort by date in ascending order

      // Set the sorted dates and the min/max values
      setDates(sortedDates);
      setMinDate(sortedDates[0].toISOString().split("T")[0]); // Convert back to YYYY-MM-DD string
      setMaxDate(
        sortedDates[sortedDates.length - 1].toISOString().split("T")[0]
      );
    } catch (error) {
      console.error(t("failedToFetchQuantity"), error);
    }
  };

  useEffect(() => {
    fetchProcess();
  }, []);

  useEffect(() => {
    if (selectedLotNo) {
      fetchQuantity(selectedLotNo);
      getAvailableDates(selectedLotNo);
    }
  }, [selectedLotNo]);

  useEffect(() => {
    const fetchDispatchedLots = async () => {
      try {
        const response = await API.get(`/Dispatch/project/${projectId}`);
        const dispatchedLotNos = response.data.filter((dispatch) => dispatch.status).map(
          (dispatch) => dispatch.lotNo
        );
        setDispatchedLots(dispatchedLotNos);
      } catch (error) {
        console.error("Failed to fetch dispatched lots:", error);
      }
    };

    fetchDispatchedLots();
  }, [projectId]);

  const fetchProcess = async () => {
    try {
      const response = await API.get("/Processes");
      setProcess(response.data);
      const ctpProcess = response.data.find((proc) => proc.name === "CTP");
      const offsetProcess = response.data.find(
        (proc) => proc.name === "Offset Printing"
      );
      const digitalProcess = response.data.find(
        (proc) => proc.name === "Digital Printing"
      );
      const cutting = response.data.find(
        (proc) => proc.name === "Cutting"
      );

      setCTP_ID(ctpProcess ? ctpProcess.id : null);
      setOFFSET_PRINTING_ID(offsetProcess ? offsetProcess.id : null);
      setDIGITAL_PRINTING_ID(digitalProcess ? digitalProcess.id : null);
      setCUTTING_ID(cutting ? cutting.id : null);
    } catch (error) {
      console.error(t("failedToFetchProcesses"), error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Process all selected catches
      const updatePromises = selectedCatches.map(async (selectedCatch) => {
        const catchToUpdate = dataSource.find((item) => item.key === selectedCatch.id);
        if (!catchToUpdate) return;

        let updatedProcessIds = [...catchToUpdate.processId];

        if (modalMessage === "switchToDigitalPrintingQuestion") {
          updatedProcessIds = updatedProcessIds.filter(
            (id) => id !== CTP_ID && id !== OFFSET_PRINTING_ID && id !== CUTTING_ID
          );
          updatedProcessIds.push(DIGITAL_PRINTING_ID);
        } else if (modalMessage === "switchToOffsetPrintingQuestion") {
          updatedProcessIds = updatedProcessIds.filter(
            (id) => id !== DIGITAL_PRINTING_ID
          );
          updatedProcessIds.push(CTP_ID);
          updatedProcessIds.push(OFFSET_PRINTING_ID);
          updatedProcessIds.push(CUTTING_ID);
        }

        const payload = {
          ...catchToUpdate,
          processId: updatedProcessIds,
          status: 1,
        };

        return API.put(`/QuantitySheet/${selectedCatch.id}`, payload);
      });

      await Promise.all(updatePromises);
      handleModalClose();
      fetchQuantity(selectedLotNo);
    } catch (error) {
      console.error(t("failedToSaveChanges"), error);
    }
  };

  const handleRemoveButtonClick = (key) => {
    const record = dataSource.find((item) => item.key === key);
    if (record) {
      setItemToDelete(record);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await API.delete(`/QuantitySheet/${itemToDelete.quantitySheetId}`);
        setDataSource((prevData) =>
          prevData.filter((item) => item.key !== itemToDelete.key)
        );
        fetchQuantity();
        setShowDeleteModal(false);
        setItemToDelete(null);
      } catch (error) {
        console.error(t("failedToDeleteItem"), error);
      }
    }
  };

  const handleConfirmStop = async () => {

    console.log("handleconfirmclose is called")

    if (itemToStop) {

      console.log("handleconfirmclose is called", itemToStop)

      try {

        await API.post(`/QuantitySheet/StopCatch?id=${itemToStop.quantitySheetId}`);

        setDataSource((prevData) =>

          prevData.filter((item) => item.key !== itemToStop.key)

        );
        fetchQuantity();

        setShowStopModal(false);

        setItemToStop(null);

      } catch (error) {

        console.error(t("failedToStopItem"), error);

      }

    }

  };



  const handleModalClose = () => {
    setShowTransferModal(false);
    setShowMergeModal(false);
    setShowDeleteModal(false);
    setItemToDelete(null);
    setEditingRow(null);
    setSelectedProcessIds([]);
    setIsConfirmed(false);
    setSelectedCatches([]);
    setModalMessage("")
    setItemToStop(null);
    setShowStopModal(false);
  };

  const handleEditButtonClick = (key) => {
    setEditingRow(key);
    const record = dataSource.find((item) => item.key === key);

    if (record) {
      if (Array.isArray(record.processId)) {
        setSelectedProcessIds(
          record.processId
            .map((id) => process.find((proc) => proc.id === id)?.name)
            .filter(Boolean)
        );
      } else {
        setSelectedProcessIds([]);
      }

      const hasCTP = record.processId.includes(CTP_ID);
      const hasOffsetPrinting = record.processId.includes(OFFSET_PRINTING_ID);
      const hasDigitalPrinting = record.processId.includes(DIGITAL_PRINTING_ID);
      const hasCutting = record.processId.includes(CUTTING_ID);

      if (hasCTP && hasOffsetPrinting && hasCutting) {
        setModalMessage("switchToDigitalPrintingQuestion");
      } else if (hasDigitalPrinting) {
        setModalMessage("switchToOffsetPrintingQuestion");
      } else {
        setModalMessage("switchProcessesQuestion");
      }
    }
  };

  const handleNewRowChange = (e) => {
    const { name, value } = e.target;
    setNewRowData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error when user starts typing
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!newRowData.catchNo) errors.catchNo = t('catchNoRequired');
    // if (!newRowData.examDate) errors.examDate = t('examDateRequired');
    //if (!newRowData.examTime) errors.examTime = t('examTimeRequired');
    if (!newRowData.quantity || newRowData.quantity <= 0) errors.quantity = t('validQuantityRequired');

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRow = async () => {
    if (!selectedLotNo) {
      console.error(t("selectedLotNoUndefined"));
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = [
      {
        catchNo: newRowData.catchNo,
        paper: newRowData.paper,
        course: newRowData.course,
        subject: newRowData.subject,
        innerEnvelope: newRowData.innerEnvelope,
        outerEnvelope: newRowData.outerEnvelope,
        lotNo: selectedLotNo,
        quantity: parseInt(newRowData.quantity, 10),
        percentageCatch: 0,
        projectId: projectId,
        examDate: newRowData.examDate,
        examTime: newRowData.examTime,
        processId: [],
        status: 0,
        pages: newRowData.pages,
        stopCatch: 0
      },
    ];

    try {
      const response = await API.post(`/QuantitySheet`, payload);
      setDataSource((prevData) => [
        ...prevData,
        {
          ...payload[0],
          quantitySheetId: response.data.quantitySheetId,
          key: response.data.quantitySheetId,
        },
      ]);
      setNewRowData({
        catchNo: "",
        paper: "",
        course: "",
        subject: "",
        examDate: "",
        examTime: "",
        innerEnvelope: "",
        outerEnvelope: 0,
        quantity: 0,
        pages: 0,
        percentageCatch: 0,
        projectId: projectId,
        status: 0,
        stopCatch: 0
      });
      setFormErrors({});
      fetchQuantity(selectedLotNo);
    } catch (error) {
      console.error(t("failedToAddNewRow"), error);
    }
  };

  const handleStopButtonClick = (key) => {
    const record = dataSource.find((item) => item.key === key);
    if (record) {
      setItemToStop(record);
      setShowStopModal(true);
    }
  };


  const handleCatchEditButton = (key) => {
    setEditableRowKey(key?.quantitySheetId); // Set the row key to editable
    const formattedExamDate = formatDateForInput(key.examDate);
    setEditedRow({ ...key, examDate: formattedExamDate });
  };

  const formatDateForInput = (dateString) => {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`; // Convert DD-MM-YYYY to YYYY-MM-DD
  };

  const handleInputChange = (field, value) => {
    setEditedRow({ ...editedRow, [field]: value }); // Update edited row data
  };

  const handleSave = async () => {
    try {
      const response = await API.put(
        `/QuantitySheet/update/${editedRow.quantitySheetId}`,
        editedRow
      );
      if (response.status === 200) {
        message.success(t("updateSuccess"));
        setEditableRowKey(null); // Exit edit mode
        fetchQuantity()
      } else {
        message.error(t("updateFailed"));
      }
    } catch (error) {
      console.error(error);
      message.error(t("updateFailed"));
    }
  };



  const handleCancel = () => {
    setEditableRowKey(null); // Exit edit mode
    setEditedRow({}); // Reset edited row
  };


  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
  };

  const isProcessSwitchingAllowed = (selectedCatches) => {
    // Get first catch record
    const firstCatch = dataSource.find(item => item.quantitySheetId === selectedCatches[0]?.id);
    if (!firstCatch) return false;

    // Check if first catch has process ID 3
    if (firstCatch.processId.includes(3)) {
      // Return true only if all catches have process ID 3
      return selectedCatches.every(catch_ => {
        const catchRecord = dataSource.find(item => item.quantitySheetId === catch_.id);
        return catchRecord && catchRecord.processId.includes(3);
      });
    }

    // Check if first catch has process IDs 1 and 2
    if (firstCatch.processId.includes(1) && firstCatch.processId.includes(2)) {
      // Return true only if all catches have process IDs 1 and 2
      return selectedCatches.every(catch_ => {
        const catchRecord = dataSource.find(item => item.quantitySheetId === catch_.id);
        return catchRecord &&
          catchRecord.processId.includes(1) &&
          catchRecord.processId.includes(2);
      });
    }

    return false;
  };

  const handleCatchesChange = (updatedCatches) => {
    setSelectedCatches(updatedCatches);
  };

  return (
    <div className='mt-'>
      {showBtn && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
            <Input.Search
              placeholder={t('searchAllFields')}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '250px' }}
              allowClear
            />

            <div>
              {selectedCatches.length > 0 && !dispatchedLots.includes(selectedLotNo) && (
                <>
                  <Button
                    type="primary"
                    className={`${customBtn} ${customDark === "dark-dark" ? `border` : `border-0`} me-2`}
                    onClick={() => handleEditButtonClick(selectedCatches[0].id)}
                  >
                    {t('editProcess')}
                  </Button>
                  <Button
                    type="primary"
                    className={`${customBtn} ${customDark === "dark-dark" ? `border` : `border-0`} me-2`}
                    onClick={() => setShowTransferModal(true)}
                  >
                    {t('transferCatch')}
                  </Button>
                </>
              )}
              {selectedCatches.length > 1 && !dispatchedLots.includes(selectedLotNo) && (

                <Button
                  type="primary"
                  className={`${customBtn} ${customDark === "dark-dark" ? `border` : `border-0`} me-2`}
                  onClick={() => setShowMergeModal(true)}
                >
                  {t('mergeCatch')}
                </Button>
              )}
              <Button
                onClick={() => setShowNewRow(prev => !prev)}
                type="primary"
                className={`${customBtn} ${customDark === "dark-dark" ? `border` : `border-0`}`}
                disabled={dispatchedLots.includes(selectedLotNo)}
              >
                {showNewRow ? t('cancel') : t('addNewCatch')}
              </Button>
            </div>
          </div>
          {showNewRow && (
            <Form layout="vertical" className="mb-3">
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label={<>
                    {t('catchNo')} <span style={{ color: 'red' }}>*</span>
                  </>}
                    validateStatus={formErrors.catchNo ? "error" : ""}
                    help={formErrors.catchNo}
                  >
                    <Input
                      size="small"
                      name="catchNo"
                      value={newRowData.catchNo}
                      onChange={handleNewRowChange}
                      placeholder={t('enterCatchNo')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label={<>
                      {t('paperCode')}
                    </>}
                    help={formErrors.paper}
                  >
                    <Input
                      size="small"
                      name="paper"
                      value={newRowData.paper}
                      onChange={handleNewRowChange}
                      placeholder={t('enterPaperCode')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label={<>
                      {t('course')}
                    </>}
                    help={formErrors.course}
                  >
                    <Input
                      size="small"
                      name="course"
                      value={newRowData.course}
                      onChange={handleNewRowChange}
                      placeholder={t('enterCourse')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label={t('subject')}>
                    <Input
                      size="small"
                      name="subject"
                      value={newRowData.subject}
                      onChange={handleNewRowChange}
                      placeholder={t('enterSubject')}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    label={<>
                      {t('examDate')}
                    </>}


                  >
                    <Input
                      size="small"
                      type="date"
                      name="examDate"
                      value={newRowData.examDate}
                      onChange={handleNewRowChange}
                      min={minDate}
                      max={maxDate}
                      //disabled={dates.length === 0}
                      placeholder={t('selectExamDate')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label={<>
                      {t('examTime')}
                    </>}

                    help={formErrors.examTime || "Please enter the time in this format: 03:00 PM to 05:00 PM"}
                  >
                    <Input
                      size="small"
                      name="examTime"
                      value={newRowData.examTime}
                      onChange={handleNewRowChange}
                      placeholder={t('enterExamTime')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label={t('innerEnvelope')}>
                    <Input
                      size="small"
                      name="innerEnvelope"
                      value={newRowData.innerEnvelope}
                      onChange={handleNewRowChange}
                      placeholder={t('enterInnerEnvelope')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label={t('outerEnvelope')}>
                    <Input
                      size="small"
                      name="outerEnvelope"
                      value={newRowData.outerEnvelope}
                      onChange={handleNewRowChange}
                      placeholder={t('enterOuterEnvelope')}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>

                <Col span={6}>
                  <Form.Item
                    label={<>
                      {t('pages')}
                    </>}

                    help={formErrors.pages}
                  >
                    <Input
                      size="small"
                      type="number"
                      name="pages"
                      value={newRowData.pages}
                      onChange={handleNewRowChange}
                      placeholder={t('enterPages')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label={<>
                      {t('quantity')} <span style={{ color: 'red' }}>*</span>
                    </>}
                    validateStatus={formErrors.quantity ? "error" : ""}
                    help={formErrors.quantity}
                  >
                    <Input
                      size="small"
                      type="number"
                      name="quantity"
                      value={newRowData.quantity}
                      onChange={handleNewRowChange}
                      placeholder={t('enterQuantity')}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label=" ">
                    <Button size="small" onClick={handleAddRow} className={`${customDark === "dark-dark" ? `border` : ``}`}>
                      {t('add')}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </>
      )}

      {showTable && (
        <Table
          columns={columns}
          dataSource={getFilteredData()}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "25", "50", "100"],
            total: getFilteredData().length,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${t("of")} ${total} ${t("items")}`,
            onShowSizeChange: handlePageSizeChange,
            className: `p-2 rounded rounded-top-0 ${customDark === "dark-dark" ? `bg-white` : ``
              } mt`,
          }}
          scroll={{ x: true }}
          className={`${customDark === "default-dark"
            ? "thead-default"
            : customDark === "red-dark"
              ? "thead-red"
              : customDark === "green-dark"
                ? "thead-green"
                : customDark === "blue-dark"
                  ? "thead-blue"
                  : customDark === "dark-dark"
                    ? "thead-dark"
                    : customDark === "pink-dark"
                      ? "thead-pink"
                      : customDark === "purple-dark"
                        ? "thead-purple"
                        : customDark === "light-dark"
                          ? "thead-light"
                          : customDark === "brown-dark"
                            ? "thead-brown"
                            : ""
            }`}
          size="small"
          tableLayout="auto"
          responsive={["sm", "md", "lg", "xl"]}
        />
      )}

      {editingRow !== null && (
        <BootstrapModal show={true} onHide={handleModalClose}>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>{t('editProcess')}</BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            <div className="mb-3">
              <strong>{t('selectedCatches')}:</strong>
              <ul>
                {selectedCatches.map((catch_, index) => (
                  <li key={index}>{catch_.catchNo}</li>
                ))}
              </ul>
            </div>
            {!isProcessSwitchingAllowed(selectedCatches) ? (
              <div className="alert alert-danger">
                <WarningOutlined /> {t('processSwitchingNotAllowed')}
              </div>
            ) : (
              <>
                {t(modalMessage)}
                <div className="mt-3">
                  <Checkbox checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)}>
                    {modalMessage === "switchToDigitalPrintingQuestion" ? t('switchFromOffsetToDigital') :
                      modalMessage === "switchToOffsetPrintingQuestion" ? t('switchFromDigitalToOffset') :
                        t('confirmThisChange')}
                  </Checkbox>
                </div>
              </>
            )}
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>{t('close')}</Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={!isConfirmed || !isProcessSwitchingAllowed(selectedCatches)}
            >
              {t('saveChanges')}
            </Button>
          </BootstrapModal.Footer>
        </BootstrapModal>
      )}

      {showDeleteModal && (
        <BootstrapModal show={true} onHide={handleModalClose}>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>
              {t("confirmDeletion")} {itemToDelete?.catchNo}
            </BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            {t("areYouSureDeleteCatchNo")} ?
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              {t("delete")}
            </Button>
          </BootstrapModal.Footer>
        </BootstrapModal>
      )}
      {showStopModal && (
        <BootstrapModal show={true} onHide={handleModalClose}>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>
              {t("confirmStop")} {itemToStop?.catchNo}
            </BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            {itemToStop.stopCatch === 0
              ? t("areYouSureStopCatchNo")
              : t("areYouSureResumeCatchNo")} {/* You can add different messages if necessary */}
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={handleConfirmStop}>
              {itemToStop.stopCatch === 0
                ? t("stop")
                : t("resume")
              }
            </Button>
          </BootstrapModal.Footer>
        </BootstrapModal>
      )}


      <CatchTransferModal
        visible={showTransferModal}
        onClose={handleModalClose}
        catches={selectedCatches}
        onCatchesChange={handleCatchesChange}
        projectId={projectId}
        fetchQuantity={fetchQuantity}
        lots={lots}
        selectedLotNo={selectedLotNo}
        dispatchedLots={dispatchedLots}
      />
      <CatchMergeModal
        visible={showMergeModal}
        onClose={handleModalClose}
        catches={selectedCatches}
        onCatchesChange={handleCatchesChange}
        projectId={projectId}
        fetchQuantity={fetchQuantity}
        lots={lots}
        selectedLotNo={selectedLotNo}
        dispatchedLots={dispatchedLots}
      />
    </div>
  );
};

export default ViewQuantitySheet;
