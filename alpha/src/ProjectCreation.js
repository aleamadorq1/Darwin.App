import React, { useState, useEffect } from 'react';
import { Form, Button, Steps, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ProjectForm from './ProjectForm';
import ProjectCostsForm from './ProjectCostsForm';
import ProjectReviewForm from './ProjectReviewForm';

const { Step } = Steps;

const ProjectCreation = () => {
  const { projectId } = useParams();
  const [current, setCurrent] = useState(0);
  const [projectForm] = Form.useForm();
  const [costForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projectCreated, setProjectCreated] = useState(!!projectId);

  useEffect(() => {
    if (projectId) {
      setProjectCreated(true);
    }
  }, [projectId]);

  const steps = [
    {
      title: 'Project Info',
      content: <ProjectForm form={projectForm} onSave={() => setProjectCreated(true)} setLoading={setLoading} />,
    },
    {
      title: 'Costs',
      content: <ProjectCostsForm form={costForm} projectId={projectId} setLoading={setLoading} />,
    },
    {
      title: 'Review',
      content: <ProjectReviewForm projectId={projectId} setLoading={setLoading} />,
    },
    {
      title: 'Step 4',
      content: 'Step 4 content placeholder',
    },
  ];

  const next = () => {
    if (current === 0) {
      handleFormValidation(projectForm, true);
    } else if (current === 1) {
      handleFormValidation(costForm, true);
    } else {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleFinish = () => {
    setLoading(true);
    costForm.validateFields()
      .then(() => {
        costForm.submit(); // Trigger cost form submit manually
        message.success('Project successfully completed!');
        setLoading(false);
      })
      .catch(errorInfo => {
        console.log('Validation Failed:', errorInfo);
        setLoading(false);
        message.error('Please complete the required fields before finishing.');
      });
  };

  const handleFormValidation = (form, goToNextStep = false) => {
    setLoading(true);
    form.validateFields()
      .then(() => {
        if (goToNextStep) {
          setCurrent(current + 1);
        }
        setLoading(false);
      })
      .catch(errorInfo => {
        console.log('Validation Failed:', errorInfo);
        setLoading(false);
        message.error('Please complete the required fields.');
      });
  };

  return (
    <>
      <Spin spinning={loading} percent={"auto"} fullscreen/>
        <div style={{ width: '100%', height: '100%' }}>
          <Steps current={current}>
            {steps.map((item, index) => (
              <Step key={index} title={item.title} />
            ))}
          </Steps>
          <div className="steps-content" style={{ marginTop: '16px' }}>
            {steps[current].content}
          </div>
          <div className="steps-action" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            {current > 0 && (
              <Button onClick={prev} icon={<LeftOutlined />}>Previous</Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next} icon={<RightOutlined />} style={{ marginLeft: 'auto' }} disabled={current === 0 && !projectCreated}>Next</Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={handleFinish} icon={<RightOutlined />} style={{ marginLeft: 'auto' }}>Finish</Button>
            )}
          </div>
        </div>
    </>
  );
};

export default ProjectCreation;
