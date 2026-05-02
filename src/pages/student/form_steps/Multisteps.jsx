/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import DashboardLayout from "../../user/DashboardLayout";

import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

import { getSingleFormData } from "../../../utils/Api";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
const steps = ["Student Details", "Academic Details", "Certificates"];

export default function Multisteps() {
  const { id } = useParams();
  const [oldFormData, setOldFormData] = useState({});
  const [oldDataCame, setOldDataCame] = useState(false);
  const [formId, setFormId] = useState(id || null);
  const [activeStep, setActiveStep] = React.useState(0);

  // Add this new function to update form data
  const updateFormData = (newData) => {
    setOldFormData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  console.log(id);
  useEffect(() => {
    if (id) {
      fetchSingleFormDataFromAPI();
    }
  }, []);

  // Add logging for formId changes
  useEffect(() => {
    console.log("Current formId in Multisteps:", formId);
  }, [formId]);

  const fetchSingleFormDataFromAPI = async () => {
    try {
      const response = await getSingleFormData(id);
      if (response?.stage === 3) {
        toast.error(`Don't try to hack..`);
        window.location.href = "/forms";
      }
      setOldFormData(response);
      setFormId(response._id); // Set formId from API response
      console.log("Setting formId from API:", response._id);
      setOldDataCame(true);
      // toast.success(`${response.message}`);
      // setActiveStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.log(error);
      // toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const stepsToRender = [
    <Step1
      key="step1"
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      oldFormData={oldFormData}
      oldDataCame={oldDataCame}
      setFormId={setFormId}
      updateFormData={updateFormData}
    />,
    <Step2
      key="step2"
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      oldFormData={{ ...oldFormData, _id: formId }}
      oldDataCame={oldDataCame}
      formId={formId}
      updateFormData={updateFormData}
    />,
    <Step3
      key="step3"
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      oldFormData={{ ...oldFormData, _id: formId }}
      oldDataCame={oldDataCame}
      formId={formId}
      updateFormData={updateFormData}
    />,
  ];

  return (
    <DashboardLayout>
      <div className="row">
        <div className="col-md-8 mx-auto">
          <Box sx={{ width: "100%" }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label, index) => {
                const stepProps = {};
                const labelProps = {};

                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>

            <>
              <div className="my-5">
                {/* // render steps */}
                {stepsToRender[activeStep]}
              </div>
            </>
          </Box>
        </div>
      </div>
    </DashboardLayout>
  );
}
