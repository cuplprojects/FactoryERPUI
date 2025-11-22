import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaUpload, FaInfoCircle } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai"; // Import the recent icon
import { useNavigate } from "react-router-dom";
import { encrypt } from "../Security/Security";
import useUserDataStore from "../store/userDataStore";
import { useTranslation } from "react-i18next";
import { Tooltip } from "antd";
import API from "../CustomHooks/MasterApiHooks/api";
import themeStore from "../store/themeStore";
import { useStore } from "zustand";

const Cards = ({ item, onclick, disableProject, activeCardStyle }) => {
  // console.log(item)
  const navigate = useNavigate();
  const { userData } = useUserDataStore();
  const role = userData?.role;
  const supervisor = role.roleId === 5;
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
  const [hasProcesses, setHasProcesses] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("Pending");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isUploadDisabled, setIsUploadDisabled] = useState(true);

  useEffect(() => {
    if (item?.projectId) {
      fetchProjectProcess();
      checkTransactionStatus();
    }
    if (parseFloat(item?.completionPercentage) >= 99.95) {
      setTransactionStatus("Completed");
    }
  }, [item?.projectId]);

  // Navigate to quantity sheet uploads and send projectId
  const handleUploadClick = (e) => {
    e.stopPropagation();
    if (hasProcesses) {
      navigate(`/quantity-sheet-uploads/${encrypt(item.projectId)}`);
    }
  };

  // API call for fetching project process
  const fetchProjectProcess = async () => {
    try {
      const response = await API.get(
        `/ProjectProcess/GetProjectProcesses/${item.projectId}`
      );
      if (response.data.length === 0) {
        setIsUploadDisabled(true);
      } else {
        setHasProcesses(true);
        setIsUploadDisabled(false);
      }
    } catch (error) {
      console.error("Error fetching project processes:", error);
      setHasProcesses(false);
      setIsUploadDisabled(true);
    }
  };

  // Check transaction status
  const checkTransactionStatus = async () => {
    if (parseFloat(item?.completionPercentage) >= 99.95) {
      setTransactionStatus("Completed");
      return;
    }
    try {
      const response = await API.get(`/Transactions/exists/${item.projectId}`);
      setTransactionStatus(response.data ? "Running" : "Pending");
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn("Transaction not found, setting status to 'Pending'.");
        setTransactionStatus("Pending");
      } else {
        console.error("Error checking transaction status:", error);
        setTransactionStatus("Pending");
      }
    }
  };

  //  const setLotInLocal = (lt) => {
  //     localStorage.setItem("selectedLot", lt)
  //   }

  // Navigate to the dashboard and send projectId as a route parameter
  const handleCardClick = () => {
    if (!disableProject) {
      setTooltipVisible(true);
      setTimeout(() => {
        setTooltipVisible(false);
      }, 2000);
      return;
    }

    navigate(`/dashboard/${encrypt(item.projectId)}`);

    // Store selected project in local storage
    const selectedProject = {
      value: item.projectId,
      label: item.projectName,
      seriesInfo: ""
    };
    localStorage.setItem("selectedProject", JSON.stringify(selectedProject));
  };

  // Handle info button click
  const handleInfoClick = (e) => {
    e.stopPropagation();
    if (!disableProject) {
      return;
    }
    onclick(item);
  };
  return (
    <StyledWrapper>
      <Tooltip
        title={
          isUploadDisabled
            ? t("firstAddProjectConfiguration")
            : !disableProject
              ? t("uploadQuantitySheetfirst")
              : ""
        }
        placement="below"
        visible={tooltipVisible}
      >
        <div
          className={` card ${!activeCardStyle
            ? `${customLight} ${customDarkText}`
            : `${customDark === "dark-dark"
              ? `bg-white text-dark border border-dark `
              : `${customDark} ${customDark === "blue-dark"
                ? "border-white"
                : customLightBorder
              } ${customLightText}`
            }  `
            }`}
          onClick={handleCardClick}
        >
          {item.isrecent && (
            <div className="recent-icon">
              <AiFillStar />
            </div>
          )}
          <div className="header">
            <h4 className="project-name">{item.projectName}</h4>
            {console.log(item.projectName)}
            <Tooltip
              title={
                isUploadDisabled
                  ? t("firstAddProjectConfiguration")
                  : t("uploadQuantitySheet")
              }
              placement="top"
            >
              <div
                className="upload-button"
                onClick={handleUploadClick}
                style={{
                  opacity: isUploadDisabled ? 0.5 : 1,
                  cursor: isUploadDisabled ? "not-allowed" : "pointer",
                }}
              >
                <FaUpload />
              </div>
            </Tooltip>
          </div>
          <p className="p-0 m-0">
            {parseFloat(item.completionPercentage) >= 99.96 ? 100 : parseFloat(item.completionPercentage).toFixed(2)}%
            {t("completed")}
          </p>
          <p className="p-0 m-0">
            {parseFloat(item.completionPercentage) >= 99.96 ? 0 : parseFloat(item.remainingPercentage).toFixed(2)}%
            {t("remaining")}
          </p>
          <p className="p-0 m-0">Status: {transactionStatus}</p>
          <Tooltip title={t("viewProjectInfo")} placement="top">
            <div
              className={`info-button ${!disableProject ? "disabled" : ""}`}
              onClick={handleInfoClick}
            >
              <FaInfoCircle />
            </div>
          </Tooltip>
        </div>
      </Tooltip>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    box-sizing: border-box;
    width: 280px;
    height: 150px;
    background: rgba(217, 217, 217, 0.3);
    border: 1px solid white;
    backdrop-filter: blur(6px);
    border-radius: 17px;
    text-align: center;
    cursor: pointer;
    transition: all 0.5s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
    color: black;
    margin: 6px;
    position: relative;

    @media (min-width: 768px) {
      width: 343px;
      height: 170px;
    }
  }

  .header {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 0 30px;

    @media (min-width: 768px) {
      padding: 0 40px;
    }
  }

  .project-name {
    white-space: normal;
    word-wrap: break-word;
    max-width: 90%;
    margin: 8px 0;
    font-size: 0.9rem;

    @media (min-width: 768px) {
      margin: 10px 0;
      font-size: 1rem;
    }
  }

  .card:hover {
    border: 1px solid black;
    transform: scale(1.05);
  }

  .card:active {
    transform: scale(0.95) rotateZ(1.7deg);
  }

  .upload-button,
  .info-button {
    position: absolute;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .upload-button {
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    padding: 10px;
    font-size: 1.2em;
    border-radius: 50%;
  }

  .info-button {
    bottom: 10px;
    right: 10px;
    padding: 10px;
    font-size: 1.2em;
    border-radius: 50%;
  }

  .upload-button:hover,
  .info-button:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .info-button.disabled,
  .upload-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .info-button.disabled:hover,
  .upload-button.disabled:hover {
    background-color: transparent;
  }

  .recent-icon {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 1.5em;
    color: gold;
  }
`;

export default Cards;