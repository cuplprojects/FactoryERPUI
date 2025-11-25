import React, { useState, useEffect } from "react";
import {
  Table,
  Dropdown,
  Menu,
  Button,
  Switch,
  Input,
  Select,
  Modal,
  Tooltip,
} from "antd";
import { notification } from "antd";
import ColumnToggleModal from "./../menus/ColumnToggleModal";
import AlarmModal from "./../menus/AlarmModal";
import InterimQuantityModal from "./../menus/InterimQuantityModal";
import RemarksModal from "./../menus/RemarksModal";
import CatchDetailModal from "./../menus/CatchDetailModal";
import SelectZoneModal from "./../menus/SelectZoneModal";
import SelectMachineModal from "../menus/SelectMachineModal";
import AssignTeamModal from "./../menus/AssignTeamModal";
import "./../styles/ProjectDetailsTable.css";
import { IoCloseCircle } from "react-icons/io5";
import StatusToggle from "../menus/StatusToggle";
import { PiDotsNineBold } from "react-icons/pi";
import { RiSearchLine } from "react-icons/ri";
import { Col, Row } from "react-bootstrap";
import { FaEdit } from "react-icons/fa";
import { FaFilter } from "react-icons/fa"; //filter icon for table filter menu
import themeStore from "./../store/themeStore";
import { useStore } from "zustand";
import { BiSolidFlag } from "react-icons/bi";
import { MdPending } from "react-icons/md"; // for pending
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5"; // for completed
import API from "../CustomHooks/MasterApiHooks/api";
import { useTranslation } from "react-i18next";
import Tippy from "@tippyjs/react";
import InputPages from "../menus/InputPages";
import { success } from "../CustomHooks/Services/AlertMessageService";


const { Option } = Select;

const ProjectDetailsTable = ({
  tableData,
  setTableData,
  projectId,
  hasFeaturePermission,
  featureData,
  processId,
  lotNo,
  fetchTransactions,
  handleLotClick,
  projectLots,
  setShowBarChart,
  showBarChart,
  setShowPieChart,
  showPieChart
}) => {
  //Theme Change Section
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const [
    customDark,
    customMid,
    customLight,
    customBtn,
    customDarkText,
    customLightText,
    customLightBorder,
    customDarkBorder,
    customThead,
  ] = getCssClasses();
  const [initialTableData, setInitialTableData] = useState(tableData);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  //default hide and unhide
  const [columnVisibility, setColumnVisibility] = useState({
    Alerts: false,
    "Interim Quantity": false,
    Remarks: false,
    Envelopes: false,
    Paper: false, // Enable by default on large screens
    Course: false,
    Subject: false,
    Zone: false, // Add Zone visibility
    Machine: false, // Add Machine visibility
    Pages: false,
  });

  const [hideCompleted, setHideCompleted] = useState(false);
  const [columnModalShow, setColumnModalShow] = useState(false);
  const [alarmModalShow, setAlarmModalShow] = useState(false);
  const [interimQuantityModalShow, setInterimQuantityModalShow] =
    useState(false);
  const [remarksModalShow, setRemarksModalShow] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [alarmModalData, setAlarmModalData] = useState(null);
  const [interimQuantityModalData, setInterimQuantityModalData] =
    useState(null);
  const [remarksModalData, setRemarksModalData] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [visibleRowKeys, setVisibleRowKeys] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [catchDetailModalShow, setCatchDetailModalShow] = useState(false);
  const [catchDetailModalData, setCatchDetailModalData] = useState(null);
  const [selectZoneModalShow, setSelectZoneModalShow] = useState(false);
  const [selectMachineModalShow, setSelectMachineModalShow] = useState(false);
  const [assignTeamModalShow, setAssignTeamModalShow] = useState(false);
  const [selectZoneModalData, setSelectZoneModalData] = useState(null);
  const [selectMachineModalData, setSelectMachineModalData] = useState(null);
  const [assignTeamModalData, setAssignTeamModalData] = useState(null);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [
    showOnlyCompletedPreviousProcess,
    setShowOnlyCompletedPreviousProcess,
  ] = useState(true);
  const [showOnlyRemarks, setShowOnlyRemarks] = useState(false);
  const [paperData, setPaperData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [examDate, setExamDate] = useState([]);
  const [examTime, setExamTime] = useState([]);
  const [inputPagesModalData, setInputPagesModalData] = useState(null);
  const [inputPagesModalShow, setInputPagesModalShow] = useState(false);
  const [envelopeData, setEnvelopeData] = useState({});
  console.log(tableData)
  const showNotification = (type, messageKey, descriptionKey, details = "") => {
    notification[type]({
      message: t(messageKey),
      description: `${t(descriptionKey)} ${details}`,
      placement: "topRight",
      duration: 3,
    });
  };

  // Add resize listener for responsive column visibility
  useEffect(() => {
    const handleResize = () => {
      setColumnVisibility((prev) => ({
        ...prev,
        Paper: window.innerWidth >= 992,
        Course: window.innerWidth >= 992,
        Subject: window.innerWidth >= 992,
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchCatchData = async () => {
      try {
        if (projectId && lotNo) {
          const response = await API.get(
            `/QuantitySheet/Catch?ProjectId=${projectId}&lotNo=${lotNo}`
          );
          const data = response.data || [];
          console.log(data);

          // Parse envelope data
          const envelopeMap = {};
          data.forEach((item) => {
            if (item.innerEnvelope) {
              const envelopes = {};
              item.innerEnvelope.split(", ").forEach((env) => {
                const [key, value] = env.split(": ");
                envelopes[key] = value || "";
              });
              envelopeMap[item.catchNo] = envelopes;
            }
          });
          setEnvelopeData(envelopeMap);
          setPaperData(
            data.filter((item) => item.paper).map((item) => item.paper)
          );
          setCourseData(
            data.filter((item) => item.course).map((item) => item.course)
          );
          setSubjectData(
            data.filter((item) => item.subject).map((item) => item.subject)
          );
          setExamDate(
            data.filter((item) => item.examDate).map((item) => item.examDate)
          );
          setExamTime(
            data.filter((item) => item.examTime).map((item) => item.examTime)
          );
        }
      } catch (error) {
        console.error("Error fetching catch data:", error);
      }
    };

    fetchCatchData();
  }, [projectId, lotNo]);

  useEffect(() => {
    // Update the initialTableData state whenever tableData changes
    setInitialTableData(tableData);
  }, [tableData]);

  useEffect(() => {
    const newVisibleKeys = filteredData.map((item) => item.srNo); // Use srNo instead of catchNumber
    setVisibleRowKeys(newVisibleKeys);
  }, [searchText, hideCompleted]); // Add other dependencies if necessary

  // Add effect to fetch transactions when processId changes
  useEffect(() => {
    if (projectId && processId) {
      fetchTransactions();
    }
  }, [processId]); // Dependency on processId

  const filteredData = tableData.filter((item) => {
    const matchesSearchText = Object.values(item).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchText.toLowerCase())
    );
    const statusCondition = !hideCompleted || item.status !== 2;
    const remarksCondition = showOnlyRemarks
      ? item.remarks && item.remarks.trim() !== ""
      : true;
    const alertsCondition = showOnlyAlerts
      ? item.alerts && item.alerts.trim() !== "" && item.alerts !== "0"
      : true;
    const previousProcessCondition = showOnlyCompletedPreviousProcess
      ? !item.previousProcessData ||
      item.previousProcessData.status === 2 ||
      (item.previousProcessData.thresholdQty != null &&
        item.previousProcessData.thresholdQty > 0 &&
        item.previousProcessData.interimQuantity >=
        item.previousProcessData.thresholdQty)
      : true;

    return (
      matchesSearchText &&
      statusCondition &&
      remarksCondition &&
      alertsCondition &&
      previousProcessCondition
    );
  });

  useEffect(() => {
    const visibleRows = filteredData
      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
      .map((row) => row.srNo);

    // If all visible rows are selected, mark "Select All" as checked
    setSelectAll(
      visibleRows.length > 0 &&
      visibleRows.every((key) => selectedRowKeys.includes(key))
    );
  }, [selectedRowKeys, currentPage, pageSize, filteredData, hideCompleted]);

  // Update useEffect to immediately fetch data when lotNo changes
  useEffect(() => {
    if (projectId && processId && lotNo) {
      fetchTransactions();
    }
  }, [projectId, processId, lotNo]);

  const handleRowStatusChange = async (srNo, newStatusIndex) => {
    const statusSteps = ["Pending", "Started", "Completed"];
    const newStatus = statusSteps[newStatusIndex];

    const updatedRow = tableData.find((row) => row.srNo === srNo);
    if (hasFeaturePermission(1)) {
      if (updatedRow.zoneId === 0 || updatedRow.zoneId === null) {
        showNotification(
          "error",
          "Status Update Failed",
          "Cannot change status: Zone is not assigned."
        );
        return;
      }
    }

    // Check if previous process exists and is not completed, with threshold exception
    if (
      updatedRow.previousProcessData &&
      updatedRow.previousProcessData !== null &&
      updatedRow.previousProcessData.status !== 2 &&
      !(
        updatedRow.previousProcessData.thresholdQty != null &&
        updatedRow.previousProcessData.thresholdQty > 0 &&
        updatedRow.previousProcessData.interimQuantity >=
        updatedRow.previousProcessData.thresholdQty
      )
    ) {
      showNotification(
        "error",
        "Status Update Failed",
        "Previous process must be completed first"
      );
      return;
    }

    // Check if independent process exists and is not completed
    if (
      updatedRow.independentProcessData &&
      updatedRow.independentProcessData !== null &&
      updatedRow.independentProcessData.status !== 2
    ) {
      showNotification(
        "error",
        "Status Update Failed",
        `${updatedRow.independentProcessData.processName} must be completed first`
      );
      return;
    }

    // Only check interim quantity if hasFeaturePermission(7) is true and interimQuantity is not 0
    if (
      hasFeaturePermission(4) &&
      newStatusIndex === 2 &&
      updatedRow.interimQuantity !== 0
    ) {
      if (updatedRow.interimQuantity !== updatedRow.quantity) {
        showNotification(
          "error",
          "Status Update Failed",
          "Interim Quantity must equal Quantity"
        );
        return;
      }
    }

    try {
      // Fetch the existing transaction data if transactionId exists
      let existingTransactionData;
      if (updatedRow.transactionId) {
        const response = await API.get(
          `/Transactions/${updatedRow.transactionId}`
        );
        existingTransactionData = response.data;
      }

      const postData = {
        transactionId: updatedRow?.transactionId || 0,
        interimQuantity: existingTransactionData
          ? existingTransactionData.interimQuantity
          : 0,
        remarks: existingTransactionData ? existingTransactionData.remarks : "",
        projectId: projectId,
        quantitysheetId: updatedRow?.srNo || 0,
        processId: processId,
        zoneId: existingTransactionData ? existingTransactionData.zoneId : 0,
        machineId: existingTransactionData
          ? existingTransactionData.machineId
          : 0,
        status: newStatusIndex,
        alarmId: existingTransactionData ? existingTransactionData.alarmId : "",
        teamId: existingTransactionData ? existingTransactionData.teamId : [],
        lotNo: existingTransactionData ? existingTransactionData.lotNo : lotNo,
        voiceRecording: existingTransactionData
          ? existingTransactionData.voiceRecording
          : "",
      };

      await API.post("/Transactions", postData);
      await fetchTransactions();
      const catchNumber = tableData.find(
        (row) => row.srNo === srNo
      )?.catchNumber;
      showNotification(
        "success",
        "rowStatusUpdateSuccess",
        "rowStatusUpdateDescription",
        `(Catch: ${catchNumber})`
      );
    } catch (error) {
      showNotification(
        "error",
        "rowStatusUpdateError",
        "rowStatusUpdateErrorDescription"
      );
      console.error("Error updating status:", error);
    }
  };



  const handleCatchClick = (record) => {
    setCatchDetailModalShow(true);
    setCatchDetailModalData(record);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "NA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const columns = [
    {
      fixed: 'left',
      title: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectAll(checked);

            if (checked) {
              // Select only visible rows on the current page of filtered data
              const visibleRowKeys = filteredData
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((row) => row.srNo);
              setSelectedRowKeys(visibleRowKeys);
            } else {
              setSelectedRowKeys([]); // Deselect all rows
            }
          }}
        />
      ),
      key: "selectAll",
      fixed: "left",
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedRowKeys.includes(record.srNo)}

          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              // Select this row
              setSelectedRowKeys([...selectedRowKeys, record.srNo]);
            } else {
              // Deselect this row
              setSelectedRowKeys(
                selectedRowKeys.filter((key) => key !== record.srNo)
              );
              setSelectAll(false); // Deselect "Select All" if individual row is deselected
            }
          }}
        />
      ),
      responsive: ["xs", "sm"],
    },
    {
      title: t("srNo"),
      fixed: 'left',
      key: "srNo",
      fixed: "left",
      align: "center",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      responsive: ["sm"],
    },
    {
      title: t("catchNo"),
      fixed: 'left',
      dataIndex: "catchNumber",
      key: "catchNumber",
      align: "center",
      fixed: "left",
      width: "15%",
      sorter: (a, b) => a.catchNumber.localeCompare(b.catchNumber),
      render: (text, record) => (
        <>
          <Row>
            <Col lg={3} md={3} sm={3} xs={3}>
              <div className="d-inline">
                {/* Check if previous process data exists */}
                {record.previousProcessData ? (
                  // If previous process is completed (status 2), show green checkmark
                  record.previousProcessData.status === 2 ? (
                    <IoCheckmarkDoneCircleSharp
                      size={20}
                      color="green"
                      className=""
                    />
                  ) : // If threshold quantity is met, show blue checkmark
                    record.previousProcessData.thresholdQty != null &&
                      record.previousProcessData.thresholdQty > 0 &&
                      record.previousProcessData.interimQuantity >=
                      record.previousProcessData.thresholdQty ? (
                      <IoCheckmarkDoneCircleSharp
                        size={20}
                        color="blue"
                        className=""
                      />
                    ) : // If status is pending (0), show orange pending icon
                      record.previousProcessData.status === 0 ? (
                        <MdPending size={20} color="orange" className="" />
                      ) : (
                        // Otherwise show orange dots for in progress
                        <MdPending size={20} color="orange" className="" />
                      )
                ) : (
                  // If no previous process, show orange checkmark
                  <IoCheckmarkDoneCircleSharp
                    size={20}
                    color="orange"
                    className=""
                  />
                )}
              </div>
            </Col>
            <Col lg={5} md={5} sm={5} xs={5}>
              <div>
                <button
                  className="rounded border fs-6 custom-zoom-btn bg-white position-relative"
                  onClick={() => handleCatchClick(record)}
                >
                  {text} {record.seriesName ? `- ${record.seriesName}` : ""}
                </button>
              </div>
            </Col>
            <Col lg={1} md={1} sm={1} xs={1}>
              <div className="d-inline">
                <span
                  className=""
                  onClick={() => {
                    setCatchDetailModalShow(true);
                    setCatchDetailModalData(record);
                  }}
                >
                  {record.remarks && (
                    <FaEdit
                      className=""
                      size={20}
                      style={{
                        position: "absolute",
                        color: "blue",
                      }}
                    />
                  )}
                </span>
              </div>
            </Col>
            <Col lg={1} md={1} sm={1} xs={1}>
              <div className="d-inline">
                <span
                  className="fs-6 position-relative"
                  onClick={() => handleCatchClick(record)}
                >
                  {record.alerts && record.alerts !== "0" && (
                    <BiSolidFlag
                      title={record.alerts}
                      className=""
                      size={20}
                      style={{
                        position: "absolute",
                        color: "red",
                      }}
                    />
                  )}
                </span>
              </div>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: t("quantity"),
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    ...(columnVisibility["Exam Date"]
      ? [
        {
          title: t("examDate"),
          dataIndex: "examDate",
          align: "center",
          key: "examDate",
          sorter: (a, b) => new Date(a.examDate) - new Date(b.examDate),
          render: (text) => formatDate(text), // Apply formatDate here
        },
      ]
      : []),
    ...(columnVisibility["Exam Time"]
      ? [
        {
          title: t("examTime"),
          dataIndex: "examTime",
          align: "center",
          key: "examTime",
          sorter: (a, b) => a.examTime - b.examTime,
        },
      ]
      : []),
    ...(columnVisibility["Pages"]
      ? [
        {
          title: t("Pages"),
          dataIndex: "pages",
          align: "center",
          key: "pages",
          sorter: (a, b) => a.pages - b.pages,
        },
      ]
      : []),
    ...(columnVisibility["Interim Quantity"]
      ? [
        {
          title: t("interimQuantity"),
          dataIndex: "interimQuantity",
          align: "center",
          key: "interimQuantity",
          sorter: (a, b) => a.interimQuantity - b.interimQuantity,
        },
      ]
      : []),
    ...(columnVisibility.Remarks
      ? [
        {
          title: t("remarks"),
          dataIndex: "remarks",
          key: "remarks",
          align: "center",
          sorter: (a, b) => a.remarks.localeCompare(b.remarks),
        },
      ]
      : []),
    ...(columnVisibility["Team Assigned"]
      ? [
        {
          title: t("teamAssigned"),
          dataIndex: "teamUserNames",
          align: "center",
          key: "teamUserNames",
          render: (teamUserNames) => teamUserNames?.join(", "),
          sorter: (a, b) => {
            const aNames = a.teamUserNames?.join(", ") || "";
            const bNames = b.teamUserNames?.join(", ") || "";
            return aNames.localeCompare(bNames);
          },
        },
      ]
      : []),
    ...(columnVisibility["Zone"]
      ? [
        {
          title: t("zone"),
          dataIndex: "zoneNo",
          align: "center",
          key: "zoneNo",
          sorter: (a, b) => (a.zoneNo || "").localeCompare(b.zoneNo || ""),
        },
      ]
      : []),
    ...(columnVisibility["Machine"]
      ? [
        {
          title: t("machine"),
          dataIndex: "machinename",
          align: "center",
          key: "machinename",
          sorter: (a, b) =>
            (a.machinename || "").localeCompare(b.machinename || ""),
        },
      ]
      : []),
    ...(columnVisibility["Course"]
      ? [
        {
          title: t("course"),

          dataIndex: "course",
          // width: '20%',
          align: "center",
          key: "course",

          sorter: (a, b) => a.course - b.course,
        },
      ]
      : []),
    ...(columnVisibility["Subject"]
      ? [
        {
          title: t("subject"),
          dataIndex: "subject",
          width: "20%",
          align: "center",
          key: "subject",

          sorter: (a, b) => a.subject - b.subject,
        },
      ]
      : []),
    ...(columnVisibility["Paper"]
      ? [
        {
          title: t("questionPaper"),
          dataIndex: "paper",
          width: "20%",
          align: "center",
          key: "paper",
          sorter: (a, b) => a.paper - b.paper,
        },
      ]
      : []),
    ...(columnVisibility["Paper Details"]
      ? [
        {
          title: t("paperDetails"),
          dataIndex: "paperDetails",
          width: "20%",
          align: "center",
          key: "paperDetails",
          render: (_, record) => (
            <div className="d-flex flex-column">
              <span className="fw-bold">{`Catch: ${record.catchNumber || "N/A"
                }`}</span>
              <span className="fw-bold">{`Course: ${record.course || "N/A"
                }`}</span>
              <span className="fw-bold">{`Paper: ${record.paper || "N/A"
                }`}</span>
              <span className="fw-bold">{`Exam Date: ${formatDate(record.examDate) || "N/A"
                }`}</span>
              <span className="fw-bold">{`Exam Time: ${record.examTime || "N/A"
                }`}</span>
            </div>
          ),
          sorter: (a, b) => a.catchNumber.localeCompare(b.catchNumber),
        },
      ]
      : []),
    ...(columnVisibility["Envelopes"]
      ? [
        {
          title: t("innerEnvelope"),
          dataIndex: "envelopes",
          width: "20%",
          align: "center",
          key: "envelopes",
          children: Object.keys(
            Object.values(envelopeData)[0] || {}
          ).map((envKey) => ({
            title: envKey,
            align: "center",
            dataIndex: "catchNo",
            key: envKey,
            render: (_, record) => {
              // Log to debug
              console.log('Record:', record);
              console.log('Envelope Data:', envelopeData);
              console.log('Specific Envelope:', envelopeData[record.catchNumber]);

              return envelopeData[record.catchNumber]?.[envKey] ||
                envelopeData[record.catchNo]?.[envKey] || ''
            }
          }))
        }
      ]
      : []),
    {
      title: t("status"),
      dataIndex: "status",
      fixed: 'right',
      key: "status",
      fixed: "right",
      align: "center",
      render: (text, record) => {
        // Add debug logging
        if (!record || text === undefined || text === null) {
          return <span>Invalid Data</span>;
        }

        const statusSteps = [t("pending"), t("started"), t("completed")];
        const initialStatusIndex = text !== undefined ? text : 0;

        const hasAlerts = Boolean(record.alerts && record.alerts !== "0"); // Check if alerts exist (not "0" and not empty/null)
        // Check if previous process exists and is completed
        const isPreviousProcessCompleted =
          // 1. If there is no previous process data, return true
          !record.previousProcessData ||
          // 2. If current process status is 0 or null/empty, check if thresholdQty is greater than interimQuantity or if previous status was 2
          ((record.status === 0 ||
            record.status === null ||
            record.status === "") &&
            ((record.previousProcessData.thresholdQty != null &&
              record.previousProcessData.thresholdQty > 0 &&
              record.previousProcessData.interimQuantity >=
              record.previousProcessData.thresholdQty) ||
              record.previousProcessData.status === 2)) ||
          // 3. If current process status is 1 and previous process status is 2, return true
          (record.status === 1 && record.previousProcessData?.status === 2) ||
          // 4. If current process status is 2, return true
          record.status === 2;

        // Check if independent process exists and is completed
        const isIndependentProcessCompleted =
          !record.independentProcessData ||
          record.independentProcessData.status === 2;

        // Check if 'Assign Team' and 'Select Zone' data is populated
        const isZoneAssigned = Boolean(record.zoneId);
        const isTeamAssigned = Boolean(record.teamId?.length);

        // Check if 'Select Machine' is required
        const hasSelectMachinePermission = hasFeaturePermission(3);

        const requirements = []; // Array to hold the reasons

        const canChangeStatus =
          isPreviousProcessCompleted &&
          isIndependentProcessCompleted &&
          (hasSelectMachinePermission
            ? record.machineId !== 0 &&
            record.machineId !== null &&
            isZoneAssigned &&
            isTeamAssigned
            : isZoneAssigned && isTeamAssigned);

        // Only check interim quantity if hasFeaturePermission(7) is true and interimQuantity is not 0
        const canBeCompleted =
          !hasFeaturePermission(4) ||
          record.interimQuantity === 0 ||
          record.interimQuantity === record.quantity;

        // Populate the requirements array based on conditions
        if (
          hasAlerts &&
          !requirements.includes(t("statusCannotBeChangedDueToAlerts"))
        ) {
          requirements.push(t("statusCannotBeChangedDueToAlerts"));
        }
        if (
          !isPreviousProcessCompleted &&
          !requirements.includes(t("previousProcessErrorDescription"))
        ) {
          requirements.push(t("previousProcessErrorDescription"));
        }
        if (
          !isIndependentProcessCompleted &&
          !requirements.includes("Independent process must be completed first")
        ) {
          requirements.push("Independent process must be completed first");
        }
        if (!canChangeStatus) {
          if (
            hasFeaturePermission(1) &&
            !isZoneAssigned &&
            !requirements.includes(t("zoneNotAssigned"))
          ) {
            requirements.push(t("zoneNotAssigned"));
          }
          if (
            hasFeaturePermission(2) &&
            !isTeamAssigned &&
            !requirements.includes(t("teamNotAssigned"))
          ) {
            requirements.push(t("teamNotAssigned"));
          }
          if (
            hasFeaturePermission(3) &&
            (record.machineId === 0 || record.machineId === null) &&
            !requirements.includes(t("machineNotAssigned"))
          ) {
            requirements.push(t("machineNotAssigned"));
          }
        }
        if (
          initialStatusIndex === 1 &&
          !canBeCompleted &&
          hasFeaturePermission(4) &&
          record.interimQuantity !== 0 &&
          !requirements.includes(
            t("cannotSetStatusToCompletedInterimQuantityMustEqualQuantity")
          )
        ) {
          requirements.push(
            t("cannotSetStatusToCompletedInterimQuantityMustEqualQuantity")
          );
        }

        const isDisabled = requirements.length > 0; // Determine if the toggle is disabled based on requirements

        return (
          <div className="d-flex justify-content-center">
            {!(record.alerts === "0" || !record.alerts?.trim()) ? (
              <Tippy
                duration={[300, 1]}
                delay={10}
                className={`${customMid} ${customLightText} ${customDarkBorder} p-2 rounded-3`}
                content={requirements.map((req, index) => (
                  <div key={index}>{req}</div>
                ))}
              >
                <span className="text-danger tooltip-trigger">
                  <StatusToggle
                    initialStatusIndex={initialStatusIndex}
                    statusSteps={statusSteps.map((status, index) => ({
                      status,
                      color:
                        index === 0 ? "red" : index === 1 ? "blue" : "green",
                    }))}
                    disabled // Disable the toggle due to alerts
                  />
                </span>
              </Tippy>
            ) : isDisabled ? (
              <Tippy
                duration={[300, 1]}
                delay={10}
                className={`${customLight} ${customDarkText} p-2 border fw-bold border-dark rounded-3`}
                content={requirements.map((req, index) => (
                  <div key={index}>{req}</div>
                ))}
              >
                <span className="tooltip-trigger">
                  <StatusToggle
                    initialStatusIndex={initialStatusIndex}
                    statusSteps={statusSteps.map((status, index) => ({
                      status,
                      color:
                        index === 0 ? "red" : index === 1 ? "blue" : "green",
                    }))}
                    disabled={true}
                  />
                </span>
              </Tippy>
            ) : (
              <StatusToggle
                initialStatusIndex={initialStatusIndex}
                onStatusChange={(newIndex) =>
                  handleRowStatusChange(record.srNo, newIndex)
                }
                statusSteps={statusSteps.map((status, index) => ({
                  status,
                  color:
                    index === 0 ? "red" : index === 1 ? "blue" : "green",
                }))}
                disabled={false}
              />
            )}
          </div>
        );
      },

      sorter: (a, b) => {
        // Convert status numbers to strings for comparison
        const statusA = a.status?.toString() || "";
        const statusB = b.status?.toString() || "";
        return statusA.localeCompare(statusB);
      },
    },
  ];

  const clearSelections = () => {
    setSelectedRowKeys([]);
    setSelectAll(false);
    setShowOptions(false);
  };

  const handleStatusChange = async (newStatus) => {
    const statusSteps = ["Pending", "Started", "Completed"];
    const newStatusIndex = statusSteps.indexOf(newStatus);

    // Check if all selected rows have completed previous process or no previous process
    const allPreviousCompleted = selectedRowKeys.every((key) => {
      const row = tableData.find((row) => row.srNo === key);
      return (
        !row.previousProcessData ||
        row.previousProcessData.status === 2 ||
        (row.previousProcessData.thresholdQty != null &&
          row.previousProcessData.thresholdQty > 0 &&
          row.previousProcessData.interimQuantity >=
          row.previousProcessData.thresholdQty)
      );
    });

    // Check if all selected rows have completed independent process or no independent process
    const allIndependentCompleted = selectedRowKeys.every((key) => {
      const row = tableData.find((row) => row.srNo === key);
      if (
        row.independentProcessData &&
        row.independentProcessData.status !== 2
      ) {
        showNotification(
          "error",
          "Status Update Failed",
          `${row.independentProcessData.processName} must be completed first`
        );
        return false;
      }
      return true;
    });

    if (!allPreviousCompleted) {
      showNotification(
        "error",
        "Status Update Failed",
        "Previous process must be completed for all selected items"
      );
      return;
    }

    if (!allIndependentCompleted) {
      showNotification(
        "error",
        "Status Update Failed",
        "Independent process must be completed for all selected items"
      );
      return;
    }

    // Only check interim quantity if hasFeaturePermission(4) is true and newStatusIndex is 2 (Completed)
    if (hasFeaturePermission(4) && newStatusIndex === 2) {
      const hasIncompleteQuantity = selectedRowKeys.some((key) => {
        const row = tableData.find((row) => row.srNo === key);
        return (
          row.interimQuantity !== 0 && row.interimQuantity !== row.quantity
        );
      });

      if (hasIncompleteQuantity) {
        showNotification(
          "error",
          "Status Update Failed",
          "Interim Quantity must equal Quantity for all selected items where Interim Quantity is not zero"
        );
        return;
      }
    }

    // Iterate over selectedRowKeys and update status
    // const updates = selectedRowKeys.map(async (key) => {
    //   const updatedRow = tableData.find((row) => row.srNo === key);
    //   if (updatedRow) {
    //     // Fetch existing transaction data if transactionId exists
    //     let existingTransactionData;
    //     if (updatedRow.transactionId) {
    //       try {
    //         const response = await API.get(
    //           `/Transactions/${updatedRow.transactionId}`
    //         );
    //         existingTransactionData = response.data;
    //       } catch (error) {
    //         console.error(`Error fetching transaction data for ${key}:`, error);
    //       }
    //     }

    //     const postData = {
    //       transactionId: updatedRow.transactionId || 0,
    //       interimQuantity: existingTransactionData
    //         ? existingTransactionData.interimQuantity
    //         : 0,
    //       remarks: existingTransactionData
    //         ? existingTransactionData.remarks
    //         : "",
    //       projectId: projectId,
    //       quantitysheetId: updatedRow.srNo,
    //       processId: processId,
    //       zoneId: existingTransactionData
    //         ? existingTransactionData.zoneId
    //         : updatedRow.zoneId || 0,
    //       machineId: existingTransactionData
    //         ? existingTransactionData.machineId
    //         : updatedRow.machineId || 0,
    //       status: newStatusIndex,
    //       alarmId: existingTransactionData
    //         ? existingTransactionData.alarmId
    //         : updatedRow.alarmId || "",
    //       teamId: existingTransactionData
    //         ? existingTransactionData.teamId
    //         : updatedRow.teamId || [],
    //       lotNo: existingTransactionData
    //         ? existingTransactionData.lotNo
    //         : lotNo,
    //       voiceRecording: existingTransactionData
    //         ? existingTransactionData.voiceRecording
    //         : "",
    //     };

    //     try {
    //       await API.post("/Transactions", postData);
    //     } catch (error) {
    //       console.error(`Error updating status for ${key}:`, error);
    //       throw error;
    //     }
    //   }
    // });
    // try {
    //   await Promise.all(updates);
    //   clearSelections();
    //   await fetchTransactions();
    //   const updatedCatches = selectedRowKeys
    //     .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
    //     .filter(Boolean)
    //     .join(", ");
    //   showNotification(
    //     "success",
    //     "statusUpdateSuccess",
    //     "statusUpdateDescription",
    //     `(Catches: ${updatedCatches})`
    //   );
    // } catch (error) {
    //   showNotification(
    //     "error",
    //     "statusUpdateError",
    //     "statusUpdateErrorDescription"
    //   );
    //   console.error("Error updating statuses:", error);
    // }

    const updates = selectedRowKeys.map(async (key) => {
  const updatedRow = tableData.find((row) => row.srNo === key);
  if (updatedRow) {
    // Fetch existing transaction data if transactionId exists
    let existingTransactionData;
    if (updatedRow.transactionId) {
      try {
        const response = await API.get(`/Transactions/${updatedRow.transactionId}`);
        existingTransactionData = response.data;
      } catch (error) {
        console.error(`Error fetching transaction data for ${key}:`, error);
      }
    }

    // Build the postData for each row
    return {
      transactionId: updatedRow.transactionId || 0,
      interimQuantity: existingTransactionData ? existingTransactionData.interimQuantity : 0,
      remarks: existingTransactionData ? existingTransactionData.remarks : "",
      projectId: projectId,
      quantitysheetId: updatedRow.srNo,
      processId: processId,
      zoneId: existingTransactionData ? existingTransactionData.zoneId : updatedRow.zoneId || 0,
      machineId: existingTransactionData ? existingTransactionData.machineId : updatedRow.machineId || 0,
      status: newStatusIndex,
      alarmId: existingTransactionData ? existingTransactionData.alarmId : updatedRow.alarmId || "",
      teamId: existingTransactionData ? existingTransactionData.teamId : updatedRow.teamId || [],
      lotNo: existingTransactionData ? existingTransactionData.lotNo : lotNo,
      voiceRecording: existingTransactionData ? existingTransactionData.voiceRecording : "",
    };
  }
});

// Wait for all data to be collected, and filter out any undefined values
const bulkData = await Promise.all(updates);
const validBulkData = bulkData.filter((data) => data !== undefined);

// Step 2: Send a single bulk request to update all the transactions
if (validBulkData.length > 0) {
  try {
    await API.post("/Transactions/Bulk", validBulkData);
    
    // Clear selections and fetch updated transactions
    clearSelections();
    await fetchTransactions();

    // Show success notification with updated catch numbers
    const updatedCatches = selectedRowKeys
      .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
      .filter(Boolean)
      .join(", ");

    showNotification(
      "success",
      "statusUpdateSuccess",
      "statusUpdateDescription",
      `(Catches: ${updatedCatches})`
    );
  } catch (error) {
    showNotification(
      "error",
      "statusUpdateError",
      "statusUpdateErrorDescription"
    );
    console.error("Error updating statuses:", error);
  }
}


  };

  const getSelectedStatus = () => {
    if (selectedRowKeys.length > 0) {
      const selectedRows = tableData.filter((row) =>
        selectedRowKeys.includes(row.srNo)
      );
      const statuses = selectedRows.map((row) => row.status);
      const uniqueStatuses = [...new Set(statuses)];
      // Check if all selected rows have the same status
      if (uniqueStatuses.length === 1) {
        const status = uniqueStatuses[0];
        // If status is 0 (Pending), return 0; if 1 (Started), return 1; if 2 (Completed), return null
        return status < 2 ? status : null;
      }
    }
    return null;
  };

  const handleToggleChange = (checked) => {
    setHideCompleted(checked);
  };

  const handleDropdownSelect = (action) => {
    if (selectedRowKeys.length > 0) {
      // Get all selected rows
      const selectedRows = tableData.filter((row) =>
        selectedRowKeys.includes(row.srNo)
      );

      if (action === "Alarm" && hasFeaturePermission(5)) {
        setAlarmModalShow(true);
        setAlarmModalData(selectedRows[0]); // Pass first selected row for single-row modals
      } else if (action === "Interim Quantity" && hasFeaturePermission(4)) {
        setInterimQuantityModalShow(true);
        setInterimQuantityModalData(selectedRows[0]); // Pass first selected row for single-row modals
      } else if (action === "Remarks") {
        setRemarksModalShow(true);
        setRemarksModalData(selectedRows[0]); // Pass first selected row for single-row modals
      } else if (action === "Select Zone" && hasFeaturePermission(1)) {
        setSelectZoneModalShow(true);

        setSelectZoneModalData(selectedRows); // Pass array of all selected rows
      } else if (action === "Select Machine" && hasFeaturePermission(3)) {
        setSelectMachineModalShow(true);
        setSelectMachineModalData(selectedRows); // Pass array of all selected rows
      } else if (action === "Assign Team" && hasFeaturePermission(2)) {
        setAssignTeamModalShow(true);
        setAssignTeamModalData(selectedRows); // Pass array of all selected rows
      } else if (action === "Pages" && hasFeaturePermission(7)) {
        setInputPagesModalShow(true);
        setInputPagesModalData(selectedRows);
      }
      else if (action === "Pages" && hasFeaturePermission(7)) {
        setInputPagesModalShow(true);
        setInputPagesModalData(selectedRows);
      }
    } else {
      alert("Please select at least one row.");
    }
  };

  const handleSelectZoneSave = async (zone) => {
    try {
      const updatedData = tableData.map((row) => {
        if (selectedRowKeys.includes(row.srNo)) {
          return { ...row, zone };
        }
        return row;
      });
      setTableData(updatedData);
      setSelectedRowKeys([]);
      setSelectAll(false);
      setShowOptions(false);
      await fetchTransactions();
      const updatedCatches = selectedRowKeys
        .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
        .filter(Boolean)
        .join(", ");
      showNotification(
        "success",
        "zoneUpdateSuccess",
        "zoneUpdateDescription",
        `(Catches: ${updatedCatches})`
      );
    } catch (error) {
      showNotification(
        "error",
        "zoneUpdateError",
        "zoneUpdateErrorDescription"
      );
    }
  };

  const handleSelectMachineSave = async (machine) => {
    try {
      const updatedData = tableData.map((row) => {
        if (selectedRowKeys.includes(row.srNo)) {
          return { ...row, machine };
        }
        return row;
      });
      setTableData(updatedData);
      setSelectedRowKeys([]);
      setSelectAll(false);
      setShowOptions(false);
      await fetchTransactions();
      const updatedCatches = selectedRowKeys
        .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
        .filter(Boolean)
        .join(", ");
      showNotification(
        "success",
        "machineUpdateSuccess",
        "machineUpdateDescription",
        `(Catches: ${updatedCatches})`
      );
    } catch (error) {
      showNotification(
        "error",
        "machineUpdateError",
        "machineUpdateErrorDescription"
      );
    }
  };

  const handleAlarmSave = async (alarm) => {
    try {
      const updatedData = tableData.map((row) => {
        if (selectedRowKeys.includes(row.srNo)) {
          return { ...row, alerts: alarm };
        }
        return row;
      });
      setTableData(updatedData);
      setSelectedRowKeys([]);
      setSelectAll(false);
      setShowOptions(false);
      await fetchTransactions();
      const updatedCatches = selectedRowKeys
        .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
        .filter(Boolean)
        .join(", ");
      showNotification(
        "success",
        "alarmUpdateSuccess",
        "alarmUpdateDescription",
        `(Catches: ${updatedCatches})`
      );
    } catch (error) {
      showNotification(
        "error",
        "alarmUpdateError",
        "alarmUpdateErrorDescription"
      );
    }
  };

  const handleInterimQuantitySave = async (interimQuantity) => {
    try {
      const updatedData = tableData.map((row) => {
        if (selectedRowKeys.includes(row.srNo)) {
          return { ...row, interimQuantity };
        }
        return row;
      });
      setTableData(updatedData);
      setSelectedRowKeys([]);
      setSelectAll(false);
      setShowOptions(false);
      await fetchTransactions();
      const updatedCatches = selectedRowKeys
        .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
        .filter(Boolean)
        .join(", ");
      showNotification(
        "success",
        "quantityUpdateSuccess",
        "quantityUpdateDescription",
        `(Catches: ${updatedCatches})`
      );
    } catch (error) {
      showNotification(
        "error",
        "quantityUpdateError",
        "quantityUpdateErrorDescription"
      );
    }
  };

  const handleRemarksSave = async (remarks, mediaBlobUrl) => {
    try {
      const updatedData = tableData.map((row) => {
        if (selectedRowKeys.includes(row.srNo)) {
          return { ...row, remarks, mediaBlobUrl };
        }
        return row;
      });
      setTableData(updatedData);
      setSelectedRowKeys([]);
      setSelectAll(false);
      setShowOptions(false);
      await fetchTransactions();
      const updatedCatches = selectedRowKeys
        .map((key) => tableData.find((row) => row.srNo === key)?.catchNumber)
        .filter(Boolean)
        .join(", ");
      showNotification(
        "success",
        "remarksUpdateSuccess",
        "remarksUpdateDescription",
        `(Catches: ${updatedCatches})`
      );
    } catch (error) {
      showNotification(
        "error",
        "remarksUpdateError",
        "remarksUpdateErrorDescription"
      );
    }
  };

  const handleCatchDetailSave = async (alarm) => {
    try {
      const updatedData = tableData.map((row) => {
        if (selectedRowKeys.includes(row.srNo)) {
          return { ...row, alerts: alarm };
        }
        return row;
      });
      setTableData(updatedData);
      setSelectedRowKeys([]);
      setSelectAll(false);
      setShowOptions(false);
      await fetchTransactions();
      showNotification(
        "success",
        "Details Updated",
        "Catch details have been successfully updated"
      );
    } catch (error) {
      showNotification(
        "error",
        "Update Failed",
        "Failed to update catch details. Please try again."
      );
    }
  };

  const selectedRows = tableData.filter((row) =>
    selectedRowKeys.includes(row.srNo)
  );

  const isCompleted = selectedRows.every((row) => row.status === 2);
  const isStarted = selectedRows.every((row) => row.status == 1);
  const allStatusZero = selectedRows.every((row) => row.status === 0);

  const menu = (
    <Menu>
      {hasFeaturePermission(5) &&
        !isCompleted &&
        selectedRowKeys.length === 1 && (
          <Menu.Item onClick={() => handleDropdownSelect("Alarm")}>
            {t("alarm")}
          </Menu.Item>
        )}
      {hasFeaturePermission(4) &&
        !isCompleted &&
        isStarted &&
        selectedRowKeys.length === 1 && (
          <Menu.Item onClick={() => handleDropdownSelect("Interim Quantity")}>
            {t("interimQuantity")}
          </Menu.Item>
        )}
      {!isCompleted && selectedRowKeys.length === 1 && (
        <Menu.Item onClick={() => handleDropdownSelect("Remarks")}>
          {t("remarks")}
        </Menu.Item>
      )}
      <Menu.Item onClick={() => setColumnModalShow(true)}>
        {t("columns")}
      </Menu.Item>
      {hasFeaturePermission(1) && allStatusZero && (
        <Menu.Item
          onClick={() => handleDropdownSelect("Select Zone")}
          disabled={selectedRowKeys.length === 0}
        >
          {t("selectZone")}
        </Menu.Item>
      )}
      {hasFeaturePermission(3) && allStatusZero && (
        <Menu.Item
          onClick={() => handleDropdownSelect("Select Machine")}
          disabled={selectedRowKeys.length === 0}
        >
          {t("selectMachine")}
        </Menu.Item>
      )}
      {hasFeaturePermission(2) && allStatusZero && (
        <Menu.Item
          onClick={() => handleDropdownSelect("Assign Team")}
          disabled={selectedRowKeys.length === 0}
        >
          {t("assignTeam")}
        </Menu.Item>
      )}
      {hasFeaturePermission(7) && allStatusZero && (
        <Menu.Item
          onClick={() => handleDropdownSelect("Pages")}
          disabled={selectedRowKeys.length === 0}
        >
          {t("Pages")}
        </Menu.Item>
      )}
    </Menu>
  );

  const customPagination = {
    className: `bg-white p-3 rounded rounded-top-0 mt-0  ${customDark === "dark-dark" ? `` : ``
      }`,
    current: currentPage,
    pageSize,
    pageSizeOptions: [5, 10, 25, 50, 100],
    showSizeChanger: true,
    onShowSizeChange: (current, size) => setPageSize(size),
    onChange: (page) => setCurrentPage(page),
    showTotal: (total) => `${t("total")} ${total} ${t("items")}`,
    locale: { items_per_page: `${t("rows")}` }, // Removes the "/page" text
    pageSizeRender: (props) => (
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginRight: 8 }} className="">
          {t("limitRows")}:
        </span>
        {props}
      </div>
    ),
    itemRender: (page, type, originalElement) => {
      if (type === "page") {
        return <span>{page}</span>;
      }
      return originalElement;
    },
  };

  const rowClassName = (record) => {
    switch (record.status) {
      case 0:
        return "status-pending-row";
      case 1:
        return "status-started-row";
      case 2:
        return "status-completed-row";
      default:
        return "";
    }
  };

  const handleAssignTeamSuccess = () => {
    showNotification(
      "success",
      "Team Assigned",
      "Team has been successfully assigned"
    );
    setSelectedRowKeys([]);
    setSelectAll(false);
    setShowOptions(false);
  };

  const handleAssignTeamError = (error) => {
    showNotification(
      "error",
      "Assignment Failed",
      "Failed to assign team. Please try again."
    );
    console.error("Error assigning team:", error);
  };

  const handleInputPagesSuccess = () => {
    success("Pages updated successfully");
    setSelectedRowKeys([]);
    setSelectAll(false);
    setShowOptions(false);
  };

  const handleInputPagesError = (error) => {
    error("Failed to update pages");
    console.error("Error updating pages:", error);
  };

  return (
    <>
      <div className="">
        <Row className={`${customLight} mb-2 p-2 rounded`}>
          <Col
            lg={1}
            md={1}
            xs={2}
            className="d-flex justify-content- mt-md-1 mt-xs-1 mb-md-1 mb-xs-1"
          >
            {hasFeaturePermission(6) && (
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item className="d-flex align-items-center">
                      <Switch
                        checked={hideCompleted}
                        onChange={handleToggleChange}
                      />
                      <span className="ms-2">{t("hideCompleted")}</span>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item className="d-flex align-items-center">
                      <Switch
                        checked={showOnlyCompletedPreviousProcess}
                        onChange={() =>
                          setShowOnlyCompletedPreviousProcess(
                            !showOnlyCompletedPreviousProcess
                          )
                        }
                      />
                      {/* <span className='ms-2'>{previousProcess} Completed</span> */}
                      <span className="ms-2">{t("previousCompleted")}</span>
                    </Menu.Item>
                    <Menu.Divider />

                    <Menu.Item className="d-flex align-items-center">
                      <Switch
                        checked={showOnlyAlerts}
                        onChange={() => setShowOnlyAlerts(!showOnlyAlerts)}
                      />
                      <span className="ms-2">{t("catchesWithAlerts")}</span>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item className="d-flex align-items-center">
                      <Switch
                        checked={showOnlyRemarks}
                        onChange={() => setShowOnlyRemarks(!showOnlyRemarks)}
                      />
                      <span className="ms-2">{t("catchesWithRemarks")}</span>
                    </Menu.Item>


                    <Menu.Divider />

                    {/* New Filters */}
                    <Menu.Item>
                      <div>
                        <Switch
                          checked={showBarChart}
                          onChange={() => setShowBarChart(!showBarChart)}
                        />
                        <span className={`ms-2 ${customDarkText}`}>
                          {t("showCatchData")}
                        </span>
                      </div>
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item>
                      <div>
                        <Switch
                          checked={showPieChart}
                          onChange={() => setShowPieChart(!showPieChart)}
                        />
                        <span className={`ms-2 ${customDarkText}`}>
                          {t("showCompletionPercentage")}
                        </span>
                      </div>
                    </Menu.Item>

                    <Menu.Item onClick={(e) => e.stopPropagation()}>
                      {" "}
                      {/* Add this */}
                      <span>{t("limitRows")}:</span>
                      <Select
                        value={pageSize}
                        style={{ width: 60 }}
                        onChange={(value) => setPageSize(value)}
                        className="ms-4"
                      >
                        <Option value={5}>5</Option>
                        <Option value={10}>10</Option>
                        <Option value={25}>25</Option>
                        <Option value={50}>50</Option>
                        <Option value={100}>100</Option>
                      </Select>
                    </Menu.Item>
                  </Menu>
                }
                trigger={["click"]}
              >
                <Button
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    padding: 0,
                    width: "30px",
                  }}
                  className={`p- border ${customDark === "dark-dark"
                    ? `${customDark} text-white`
                    : "bg-white"
                    }`}
                >
                  <FaFilter size={20} className={`${customDarkText}`} />
                </Button>
              </Dropdown>
            )}
          </Col>

          {/* update status button */}
          <Col lg={1} md={1} xs={2} className="mt-md-1 mt-xs-1">
            {selectedRowKeys.length > 1 && getSelectedStatus() !== null && (
              <div className="mt-1 d-flex align-items-center">
                {
                  hasFeaturePermission(8) && (
                    <span
                      className={`me-2 ${customDark === "dark-dark"
                        ? "text-white"
                        : "custom-theme-dark-text"
                        } fs-6 fw-bold`}
                    >
                      {t("updateStatus")}
                    </span>
                  )
                }

                {(() => {
                  const requirements = [];
                  const selectedRows = selectedRowKeys
                    .map((srNo) => tableData.find((item) => item.srNo === srNo))
                    .filter(Boolean);

                  // Check if any selected row has alerts
                  const hasAlertsRow = selectedRows.find(
                    (row) => row.alerts && row.alerts !== "0"
                  );
                  if (hasAlertsRow) {
                    requirements.push(t("statusCannotBeChangedDueToAlerts"));
                  }
                  const updateall = hasFeaturePermission(8)
                  // Check previous process completion
                  const hasIncompletePrevious = selectedRows.find((row) => {
                    return (
                      row.previousProcessData &&
                      row.previousProcessData.status !== 2 &&
                      !(
                        row.previousProcessData.thresholdQty != null &&
                        row.previousProcessData.thresholdQty >
                        row.previousProcessData.interimQuantity
                      )
                    );
                  });
                  if (hasIncompletePrevious) {
                    requirements.push(t("previousProcessErrorDescription"));
                  }

                  // Check zone assignment if permission exists
                  if (hasFeaturePermission(1)) {
                    const missingZone = selectedRows.find((row) => !row.zoneId);
                    if (missingZone) {
                      requirements.push(t("zoneNotAssigned"));
                    }
                  }

                  // Check team assignment if permission exists
                  if (hasFeaturePermission(2)) {
                    const missingTeam = selectedRows.find(
                      (row) => !row.teamId?.length
                    );
                    if (missingTeam) {
                      requirements.push(t("teamNotAssigned"));
                    }
                  }

                  // Check machine assignment if permission exists
                  const hasSelectMachinePermission = hasFeaturePermission(3);
                  if (hasSelectMachinePermission) {
                    const missingMachine = selectedRows.find(
                      (row) => row.machineId === 0 || row.machineId === null
                    );
                    if (missingMachine) {
                      requirements.push(t("machineNotAssigned"));
                    }
                  }

                  // Check completion requirements if trying to complete
                  if (getSelectedStatus() === 1 && hasFeaturePermission(4)) {
                    const incompleteQuantity = selectedRows.find(
                      (row) =>
                        row.interimQuantity !== 0 &&
                        row.interimQuantity !== row.quantity
                    );
                    if (incompleteQuantity) {
                      requirements.push(
                        t(
                          "cannotSetStatusToCompletedInterimQuantityMustEqualQuantity"
                        )
                      );
                    }
                  }
                  console.log(updateall)
                  if (!updateall) {
                    return null; // Return null if permission is not granted
                  }
                  const StatusToggleComponent = (
                    <StatusToggle
                      initialStatusIndex={getSelectedStatus()}
                      onStatusChange={(newIndex) =>
                        handleStatusChange(
                          ["Pending", "Started", "Completed"][newIndex]
                        )
                      }
                      statusSteps={[
                        { status: t("pending"), color: "red" },
                        { status: t("started"), color: "blue" },
                        { status: t("completed"), color: "green" },
                      ]}
                      disabled={requirements.length > 0}
                    />
                  );

                  return requirements.length > 0 ? (
                    <Tooltip
                      title={requirements.map((req, index) => (
                        <div key={index}>{req}</div>
                      ))}
                      placement="top"
                    >
                      <span>{StatusToggleComponent}</span>
                    </Tooltip>
                  ) : (
                    StatusToggleComponent
                  );
                })()}
              </div>
            )}
          </Col>

          <Col lg={6} md={8} className="pe-0">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {projectLots.map((lot, index) => (
                <button
                  key={index}
                  className={`btn btn-sm ${lotNo === lot.lotNo
                      ? "bg-white text-dark border-dark"
                      : customBtn
                    } ${customDark === "dark-dark" ? "border" : "custom-light-border"
                    } 
                d-flex align-items-center justify-content-center p-2 rounded-2 ${customDark === "dark-dark"
                      ? "text-dark border-dark"
                      : "text-dark"
                    } ${customDarkBorder}`}
                  onClick={() => handleLotClick(lot.lotNo)}
                  style={{
                    minWidth: "100px",
                    transition: "all 0.2s",
                  }}
                >
                  {t("lot")} {lot.lotNo}
                </button>
              ))}
            </div>
          </Col>

          {/* search box */}
          <Col lg={3} md={1} xs={12}>
            <div className="d-flex justify-content-end align-items-center search-container">
              {searchVisible && (
                <div
                  className="search-box"
                  style={{ position: "relative", zIndex: "2" }}
                >
                  {searchText && (
                    <Button
                      className={`${customBtn}`}
                      onClick={() => setSearchText("")}
                      icon={
                        <IoCloseCircle
                          size={25}
                          className={`rounded-circle ${customBtn}`}
                        />
                      }
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        right: 8,
                      }}
                    />
                  )}
                  <Input
                    placeholder="Search Within Table"
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: "180px" }} // Space for remove icon
                    className={`custom-placeholder text-primary `}
                  />
                </div>
              )}
              <Button
                onClick={() => setSearchVisible(!searchVisible)}
                icon={<RiSearchLine size={20} />}
                className="custom-theme-dark-borde p-1 search-btn"
                style={{ marginLeft: 5 }}
              />
            </div>
          </Col>

          {/* group action icon */}
          <Col lg={1} md={1} xs={2}>
            <div className="d-flex justify-content-end ms-">
              <Dropdown overlay={menu} trigger={["click"]}>
                <Button
                  style={{
                    backgroundColor: "transparent", // Remove background
                    border: "none", // Remove border
                    boxShadow: "none", // Remove shadow
                    padding: 0, // Optional: adjust padding if needed
                  }}
                >
                  <PiDotsNineBold
                    size={30}
                    className={` ${customDark === "dark-dark" ? "text-white" : customDarkText
                      }`}
                  />
                </Button>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </div>
      <div>
        <Row>
          <Col lg={12} md={12}>
            <Table
              rowClassName={rowClassName}
              className={`${customDark === "default-dark" ? "thead-default" : ""
                }
            ${customDark === "red-dark" ? "thead-red" : ""}
            ${customDark === "green-dark" ? "thead-green" : ""}
            ${customDark === "blue-dark" ? "thead-blue" : ""}
            ${customDark === "dark-dark" ? "thead-dark" : ""}
            ${customDark === "pink-dark" ? "thead-pink" : ""}
            ${customDark === "purple-dark" ? "thead-purple" : ""}
            ${customDark === "light-dark" ? "thead-light" : ""}
            ${customDark === "brown-dark" ? "thead-brown" : ""} `}
              rowKey="srNo"
              columns={columns}
              dataSource={filteredData}
              pagination={customPagination}
              bordered
              style={{ position: "relative", zIndex: "900" }}
              striped={true}
              tableLayout="auto"
              responsive={true}
              scroll={{ x: true }}
              size="middle"
            />
          </Col>
        </Row>
      </div>
      <ColumnToggleModal
        show={columnModalShow}
        handleClose={() => setColumnModalShow(false)}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        featureData={featureData}
        hasFeaturePermission={hasFeaturePermission}
        processId={processId}
      />
      <AlarmModal
        show={alarmModalShow}
        handleClose={() => setAlarmModalShow(false)}
        processId={processId}
        handleSave={handleAlarmSave}
        data={alarmModalData} // Pass the alarm modal data as a prop
      />
      <InterimQuantityModal
        show={interimQuantityModalShow}
        handleClose={() => setInterimQuantityModalShow(false)}
        processId={processId}
        handleSave={handleInterimQuantitySave}
        data={interimQuantityModalData} // Pass the interim quantity modal data as a prop
      />
      <RemarksModal
        show={remarksModalShow}
        handleClose={() => setRemarksModalShow(false)}
        processId={processId}
        handleSave={handleRemarksSave}
        data={remarksModalData} // Pass the remarks modal data as a prop
      />
      <CatchDetailModal
        show={catchDetailModalShow}
        handleClose={() => setCatchDetailModalShow(false)}
        data={catchDetailModalData}
        handleSave={handleCatchDetailSave}
        processId={processId}
      />
      <SelectZoneModal
        show={selectZoneModalShow}
        handleClose={() => setSelectZoneModalShow(false)}
        handleSave={handleSelectZoneSave}
        data={selectZoneModalData}
        processId={processId}
      />
      <SelectMachineModal
        show={selectMachineModalShow}
        handleClose={() => setSelectMachineModalShow(false)}
        handleSave={handleSelectMachineSave}
        data={selectMachineModalData}
        processId={processId}
      />
      <AssignTeamModal
        show={assignTeamModalShow}
        handleClose={() => setAssignTeamModalShow(false)}
        fetchTransactions={fetchTransactions}
        data={assignTeamModalData}
        processId={processId}
        onSuccess={handleAssignTeamSuccess}
        onError={handleAssignTeamError}
      />
      <InputPages
        show={inputPagesModalShow}
        onClose={() => {
          setInputPagesModalShow(false);
          setSelectedRowKeys([]);
        }}
        data={inputPagesModalData}
        processId={processId}
        fetchTransactions={fetchTransactions}
        onSuccess={handleInputPagesSuccess}
        onError={handleInputPagesError}
      />
    </>
  );
};

export default ProjectDetailsTable;
