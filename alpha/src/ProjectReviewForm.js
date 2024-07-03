import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Collapse, Space, Button, Form, InputNumber, message, Typography, Divider, Row, Col, Statistic, Card, Progress, Select } from 'antd';
import { InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const ProjectReviewForm = ({ form, onSave, setLoading }) => {
  const { projectId } = useParams();
  const [data, setData] = useState([]);
  const [adjustmentType, setAdjustmentType] = useState('all');

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://localhost:7115/api/ProjectDetails/${projectId}/costs`);
      setData(response.data);

      const formData = {};
      response.data.forEach((module) => {
        module.moduleMaterials.forEach((material, index) => {
          formData[`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] = material.unitPrice;
          formData[`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] = material.cifPrice;
        });
        module.moduleLabors.forEach((labor, index) => {
          formData[`labor_${module.moduleId}_${labor.moduleLaborId}_hourlyRate_${index}`] = labor.hourlyRate;
        });
      });
      form.setFieldsValue(formData);

    } catch (error) {
      console.error('Error fetching project details:', error);
      message.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [projectId, setLoading, form]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const updatedData = data.map(module => ({
        ...module,
        moduleMaterials: module.moduleMaterials.map((material, index) => ({
          ...material,
          unitPrice: values[`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`],
          cifPrice: values[`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`],
        })),
        moduleLabors: module.moduleLabors.map((labor, index) => ({
          ...labor,
          hourlyRate: values[`labor_${module.moduleId}_${labor.moduleLaborId}_hourlyRate_${index}`],
        }))
      }));

      await axios.post(`https://localhost:7115/api/ProjectDetails/${projectId}/save`, updatedData);
      message.success('Changes saved successfully');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving:', error);
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const adjustPrices = (percentage) => {
    const updatedData = data.map((module) => {
      const updatedMaterials = adjustmentType === 'materials' || adjustmentType === 'all'
        ? module.moduleMaterials.map((material) => ({
          ...material,
          unitPrice: parseFloat((material.unitPrice * (1 + percentage / 100)).toFixed(2)),
          cifPrice: parseFloat((material.cifPrice * (1 + percentage / 100)).toFixed(2)),
        }))
        : module.moduleMaterials;

      const updatedLabors = adjustmentType === 'labor' || adjustmentType === 'all'
        ? module.moduleLabors.map((labor) => ({
          ...labor,
          hourlyRate: parseFloat((labor.hourlyRate * (1 + percentage / 100)).toFixed(2)),
        }))
        : module.moduleLabors;

      const updatedTotal = updatedMaterials.reduce((sum, material) => sum + (material.unitPrice * material.quantity), 0)
        + updatedLabors.reduce((sum, labor) => sum + (labor.hourlyRate * labor.quantity), 0);

      return {
        ...module,
        moduleMaterials: updatedMaterials,
        moduleLabors: updatedLabors,
        total: updatedTotal,
      };
    });

    setData(updatedData);
    // Update form values to reflect new prices
    const formData = {};
    updatedData.forEach((module) => {
      module.moduleMaterials.forEach((material, index) => {
        formData[`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] = material.unitPrice;
        formData[`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] = material.cifPrice;
      });
      module.moduleLabors.forEach((labor, index) => {
        formData[`labor_${module.moduleId}_${labor.moduleLaborId}_hourlyRate_${index}`] = labor.hourlyRate;
      });
    });
    form.setFieldsValue(formData);
  };

  const resetPrices = () => {
    fetchProjectDetails();
  };

  // Calculate totals
  const totalMaterials = data.reduce((sum, module) => sum + module.moduleMaterials.reduce((mSum, material) => mSum + (material.unitPrice * material.quantity), 0), 0);
  const totalLabor = data.reduce((sum, module) => sum + module.moduleLabors.reduce((lSum, labor) => lSum + (labor.hourlyRate * labor.quantity), 0), 0);
  const grandTotal = totalMaterials + totalLabor || 'N/A';

  const systemCosts = data.reduce((acc, module) => {
    const moduleTotal = module.moduleMaterials.reduce((mSum, material) => mSum + (material.unitPrice * material.quantity), 0)
      + module.moduleLabors.reduce((lSum, labor) => lSum + (labor.hourlyRate * labor.quantity), 0);
    if (!acc[module.systemName]) {
      acc[module.systemName] = {
        systemName: module.systemName,
        systemTotal: 0
      };
    }
    acc[module.systemName].systemTotal += moduleTotal;
    return acc;
  }, {});

  const systemCostArray = Object.values(systemCosts);
  const moduleCosts = systemCostArray
    .map(system => ({
      systemName: system.systemName,
      percentage: ((system.systemTotal / grandTotal) * 100).toFixed(2)
    }))
    .filter(system => parseFloat(system.percentage) > 0);

  return (
    <>
      <Paragraph>
        <InfoCircleOutlined style={{ marginRight: 8 }} />
        Here you review your project and fine-tune the costs. Please fill in the details below.
      </Paragraph>
      <Divider />
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Materials"
              value={totalMaterials || 'N/A'}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Labor"
              value={totalLabor || 'N/A'}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Grand Total"
              value={grandTotal || 'N/A'}
              precision={2}
              valueStyle={{ color: '#000' }}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>
      <Divider />
      <Row gutter={16} justify="center">
        {moduleCosts.map(system => (
          <Col key={system.systemName} span={6} style={{ textAlign: 'center' }}>
            <Progress type="circle" percent={parseFloat(system.percentage)} si={80} />
            <div style={{ marginTop: 8 }}>{system.systemName} ({system.percentage}%)</div>
          </Col>
        ))}
      </Row>
      <Divider />
      <Row gutter={16} justify="center" style={{ marginBottom: 16 }}>
        <Col>
          <Select defaultValue="all" onChange={value => setAdjustmentType(value)} style={{ width: 200 }}>
            <Option value="all">All</Option>
            <Option value="materials">Materials</Option>
            <Option value="labor">Labor</Option>
          </Select>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => adjustPrices(-5)}>-5%</Button>
            <Button onClick={() => adjustPrices(-1)}>-1%</Button>
            <Button onClick={() => adjustPrices(1)}>+1%</Button>
            <Button onClick={() => adjustPrices(5)}>+5%</Button>
            <Button onClick={resetPrices}>Reset</Button>
          </Space>
        </Col>
      </Row>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Collapse>
          {data.filter(module => module.moduleMaterials.length > 0 || module.moduleLabors.length > 0).map((module) => (
            <Panel
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{module.moduleName}</span>
                  <span>Qty: {module.quantity} | Total: {module.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
              }
              key={module.moduleId}
            >
              <Collapse>
                <Panel header="Materials" key={`materials_${module.moduleId}`} style={{ padding: '0' }}>
                  {module.moduleMaterials.map((material, index) => (
                    <div key={`material_${module.moduleId}_${material.projectMaterialId}_${index}`} style={{ marginBottom: '16px' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>{material.materialName}</span>
                        <span>Qty: {material.quantity}</span>
                        <Form.Item
                          name={`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`}
                          rules={[{ required: true, message: 'Please enter unit price' }]}
                          style={{ margin: 0 }}
                          label="Unit Price"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                        <Form.Item
                          name={`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`}
                          rules={[{ required: true, message: 'Please enter CIF price' }]}
                          style={{ margin: 0 }}
                          label="CIF Price"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                      </Space>
                    </div>
                  ))}
                </Panel>
                <Panel header="Labor" key={`labor_${module.moduleId}`} style={{ padding: '0' }}>
                  {module.moduleLabors.map((labor, index) => (
                    <div key={`labor_${module.moduleId}_${labor.moduleLaborId}_${index}`} style={{ marginBottom: '16px' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>{labor.laborType}</span>
                        <span>Qty: {labor.quantity}</span>
                        <Form.Item
                          name={`labor_${module.moduleId}_${labor.moduleLaborId}_hourlyRate_${index}`}
                          rules={[{ required: true, message: 'Please enter hourly rate' }]}
                          style={{ margin: 0 }}
                          label="Hourly Rate"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                      </Space>
                    </div>
                  ))}
                </Panel>
              </Collapse>
            </Panel>
          ))}
        </Collapse>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
          Save Changes
        </Button>
      </Form>
    </>
  );
};

const ProjectReview = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
      <ProjectReviewForm form={form} setLoading={setLoading} />
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default ProjectReview;
