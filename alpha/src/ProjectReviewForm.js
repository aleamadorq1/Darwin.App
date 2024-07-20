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
  const [data, setData] = useState({ modules: [], modulesComposite: [] });
  const [adjustmentType, setAdjustmentType] = useState('all');
  const [profitMargin, setProfitMargin] = useState(0);
  const [distance, setDistance] = useState(0);

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://localhost:7115/api/ProjectDetails/${projectId}/costs`);
      const projectData = response.data || { modules: [], modulesComposite: [] };
      const formData = {};

      projectData.modules.forEach((module) => {
        module.moduleMaterials.forEach((material, index) => {
          formData[`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] = material.unitPrice;
          formData[`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] = material.cifPrice;
          formData[`material_${module.moduleId}_${material.projectMaterialId}_handlingCost_${index}`] = material.handlingCost;
          formData[`material_${module.moduleId}_${material.projectMaterialId}_taxRate_${index}`] = material.taxRate;
        });
        module.moduleLabors.forEach((labor, index) => {
          formData[`labor_${module.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`] = labor.hourlyRate;
          formData[`labor_${module.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`] = labor.hoursRequired;
          formData[`labor_${module.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`] = labor.allowanceAmount;
          formData[`labor_${module.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`] = labor.allowanceQuantity;
        });
      });

      formData.profitMargin = projectData.profitMargin; // Set the initial profit margin in the form

      form.setFieldsValue(formData);
      setData(projectData);
      setProfitMargin(projectData.profitMargin); // Set the initial profit margin
      setDistance(projectData.distance); // Set the distance
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
      const updatedModules = data.modules.map(module => ({
        ...module,
        moduleMaterials: (module.moduleMaterials || []).map((material, index) => ({
          ...material,
          unitPrice: values[`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] ?? material.unitPrice,
          cifPrice: values[`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] ?? material.cifPrice,
          handlingCost: values[`material_${module.moduleId}_${material.projectMaterialId}_handlingCost_${index}`] ?? material.handlingCost,
          taxRate: values[`material_${module.moduleId}_${material.projectMaterialId}_taxRate_${index}`] ?? material.taxRate,
        })),
        moduleLabors: (module.moduleLabors || []).map((labor, index) => ({
          ...labor,
          hourlyRate: values[`labor_${module.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`] ?? labor.hourlyRate,
          hoursRequired: values[`labor_${module.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`] ?? labor.hoursRequired,
          allowanceAmount: values[`labor_${module.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`] ?? labor.allowanceAmount,
          allowanceQuantity: values[`labor_${module.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`] ?? labor.allowanceQuantity,
        }))
      }));

      const updatedComposites = data.modulesComposite.map(composite => ({
        ...composite,
        compositeDetails: (composite.compositeDetails || []).map(detail => ({
          ...detail,
          module: {
            ...detail.module,
            moduleMaterials: (detail.module.moduleMaterials || []).map((material, index) => ({
              ...material,
              unitPrice: values[`material_${detail.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] ?? material.unitPrice,
              cifPrice: values[`material_${detail.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] ?? material.cifPrice,
              handlingCost: values[`material_${detail.moduleId}_${material.projectMaterialId}_handlingCost_${index}`] ?? material.handlingCost,
              taxRate: values[`material_${detail.moduleId}_${material.projectMaterialId}_taxRate_${index}`] ?? material.taxRate,
            })),
            moduleLabors: (detail.module.moduleLabors || []).map((labor, index) => ({
              ...labor,
              hourlyRate: values[`labor_${detail.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`] ?? labor.hourlyRate,
              hoursRequired: values[`labor_${detail.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`] ?? labor.hoursRequired,
              allowanceAmount: values[`labor_${detail.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`] ?? labor.allowanceAmount,
              allowanceQuantity: values[`labor_${detail.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`] ?? labor.allowanceQuantity,
            }))
          }
        }))
      }));

      const updatedData = {
        ...data,
        modules: updatedModules,
        modulesComposite: updatedComposites,
        profitMargin: values.profitMargin ?? profitMargin, // Include the updated profit margin
      };

      await axios.put(`https://localhost:7115/api/ProjectDetails/${projectId}/costs`, updatedData);
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
    const adjustValue = (value) => parseFloat((value * (1 + percentage / 100)).toFixed(2));

    const adjustedModules = data.modules.map((module) => {
      const adjustedMaterials = (adjustmentType === 'materials' || adjustmentType === 'all')
        ? module.moduleMaterials.map((material) => ({
          ...material,
          unitPrice: adjustValue(material.unitPrice),
          cifPrice: adjustValue(material.cifPrice),
          handlingCost: adjustValue(material.handlingCost),
          taxRate: adjustValue(material.taxRate),
        }))
        : module.moduleMaterials;

      const adjustedLabors = (adjustmentType === 'labor' || adjustmentType === 'all')
        ? module.moduleLabors.map((labor) => ({
          ...labor,
          hourlyRate: adjustValue(labor.hourlyRate),
          hoursRequired: labor.hoursRequired,
          allowanceAmount: adjustValue(labor.allowanceAmount),
          allowanceQuantity: labor.allowanceQuantity,
        }))
        : module.moduleLabors;

      const updatedTotal = adjustedMaterials.reduce((sum, material) => sum + (material.unitPrice * material.quantity), 0)
        + adjustedLabors.reduce((sum, labor) => sum + ((labor.hourlyRate * labor.hoursRequired) + (labor.allowanceAmount * labor.allowanceQuantity)) * labor.quantity, 0);

      return {
        ...module,
        moduleMaterials: adjustedMaterials,
        moduleLabors: adjustedLabors,
        total: updatedTotal,
      };
    });

    const adjustedComposites = data.modulesComposite.map((composite) => {
      const adjustedCompositeDetails = composite.compositeDetails.map((detail) => {
        const adjustedMaterials = (adjustmentType === 'materials' || adjustmentType === 'all')
          ? detail.module.moduleMaterials.map((material) => ({
            ...material,
            unitPrice: adjustValue(material.unitPrice),
            cifPrice: adjustValue(material.cifPrice),
            handlingCost: adjustValue(material.handlingCost),
            taxRate: adjustValue(material.taxRate),
          }))
          : detail.module.moduleMaterials;

        const adjustedLabors = (adjustmentType === 'labor' || adjustmentType === 'all')
          ? detail.module.moduleLabors.map((labor) => ({
            ...labor,
            hourlyRate: adjustValue(labor.hourlyRate),
            hoursRequired: labor.hoursRequired,
            allowanceAmount: adjustValue(labor.allowanceAmount),
            allowanceQuantity: labor.allowanceQuantity,
          }))
          : detail.module.moduleLabors;

        const updatedTotal = adjustedMaterials.reduce((sum, material) => sum + (material.unitPrice * material.quantity), 0)
          + adjustedLabors.reduce((sum, labor) => sum + ((labor.hourlyRate * labor.hoursRequired) + (labor.allowanceAmount * labor.allowanceQuantity)) * labor.quantity, 0);

        return {
          ...detail,
          module: {
            ...detail.module,
            moduleMaterials: adjustedMaterials,
            moduleLabors: adjustedLabors,
            total: updatedTotal,
          },
        };
      });

      const updatedCompositeTotal = adjustedCompositeDetails.reduce((sum, detail) => sum + (detail.module.total * detail.quantity), 0);

      return {
        ...composite,
        compositeDetails: adjustedCompositeDetails,
        total: updatedCompositeTotal,
      };
    });

    const adjustedData = {
      ...data,
      modules: adjustedModules,
      modulesComposite: adjustedComposites,
    };

    setData(adjustedData);

    const formData = {};
    adjustedData.modules.forEach((module) => {
      module.moduleMaterials.forEach((material, index) => {
        formData[`material_${module.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] = material.unitPrice;
        formData[`material_${module.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] = material.cifPrice;
        formData[`material_${module.moduleId}_${material.projectMaterialId}_handlingCost_${index}`] = material.handlingCost;
        formData[`material_${module.moduleId}_${material.projectMaterialId}_taxRate_${index}`] = material.taxRate;
      });
      module.moduleLabors.forEach((labor, index) => {
        formData[`labor_${module.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`] = labor.hourlyRate;
        formData[`labor_${module.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`] = labor.hoursRequired;
        formData[`labor_${module.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`] = labor.allowanceAmount;
        formData[`labor_${module.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`] = labor.allowanceQuantity;
      });
    });
    adjustedData.modulesComposite.forEach((composite) => {
      composite.compositeDetails.forEach((detail) => {
        detail.module.moduleMaterials.forEach((material, index) => {
          formData[`material_${detail.moduleId}_${material.projectMaterialId}_unitPrice_${index}`] = material.unitPrice;
          formData[`material_${detail.moduleId}_${material.projectMaterialId}_cifPrice_${index}`] = material.cifPrice;
          formData[`material_${detail.moduleId}_${material.projectMaterialId}_handlingCost_${index}`] = material.handlingCost;
          formData[`material_${detail.moduleId}_${material.projectMaterialId}_taxRate_${index}`] = material.taxRate;
        });
        detail.module.moduleLabors.forEach((labor, index) => {
          formData[`labor_${detail.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`] = labor.hourlyRate;
          formData[`labor_${detail.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`] = labor.hoursRequired;
          formData[`labor_${detail.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`] = labor.allowanceAmount;
          formData[`labor_${detail.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`] = labor.allowanceQuantity;
        });
      });
    });
    form.setFieldsValue(formData);
  };

  const resetPrices = () => {
    fetchProjectDetails();
  };

  const calculateTotal = (items, priceKey, quantityKey) => 
    items.reduce((sum, item) => sum + (item[priceKey] * item[quantityKey]), 0);

  const calculateLaborTotal = (items) => 
    items.reduce((sum, item) => sum + (((item.hourlyRate * item.hoursRequired) + (item.allowanceAmount * item.allowanceQuantity)) * item.quantity), 0);

  const calculateAllowanceTotal = (items) => 
    items.reduce((sum, item) => sum + (item.allowanceAmount * item.allowanceQuantity * item.quantity), 0);

  const calculateHandlingCostTotal = (items) => 
    items.reduce((sum, item) => sum + (item.handlingCost * item.quantity), 0);

  const calculateTaxTotal = (items) => 
    items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * (item.taxRate/100)), 0);

  const systemCosts = data.modules.reduce((acc, module) => {
    const moduleTotal = calculateTotal(module.moduleMaterials, 'unitPrice', 'quantity') +
                        calculateLaborTotal(module.moduleLabors);
    if (!acc[module.systemName]) {
      acc[module.systemName] = { systemName: module.systemName, systemTotal: 0 };
    }
    acc[module.systemName].systemTotal += moduleTotal;
    return acc;
  }, {});
  
  const totalSystemCost = Object.values(systemCosts).reduce((sum, system) => sum + system.systemTotal, 0);
  
  const systemCostArray = Object.values(systemCosts).map(system => ({
    systemName: system.systemName,
    percentage: ((system.systemTotal / totalSystemCost) * 100).toFixed(1),
  })).filter(system => parseFloat(system.percentage) > 0);

  const calculateCompositeTotal = (composite) => {
    return composite.compositeDetails.reduce((total, detail) => {
      const moduleTotal = calculateTotal(detail.module.moduleMaterials, 'unitPrice', 'quantity') +
                          calculateLaborTotal(detail.module.moduleLabors);
      return total + (moduleTotal * detail.quantity);
    }, 0);
  };

  const totalMaterials = calculateTotal(data.modules.flatMap(module => module.moduleMaterials), 'unitPrice', 'quantity');
  const totalLabor = calculateLaborTotal(data.modules.flatMap(module => module.moduleLabors));
  const totalAllowances = calculateAllowanceTotal(data.modules.flatMap(module => module.moduleLabors));
  const totalHandlingCosts = calculateHandlingCostTotal(data.modules.flatMap(module => module.moduleMaterials));
  const totalTaxes = calculateTaxTotal(data.modules.flatMap(module => module.moduleMaterials ));
  const totalCompositeMaterials = calculateTotal(data.modulesComposite.flatMap(composite => composite.compositeDetails.flatMap(detail => detail.module.moduleMaterials)), 'unitPrice', 'quantity');
  const totalCompositeLabor = calculateLaborTotal(data.modulesComposite.flatMap(composite => composite.compositeDetails.flatMap(detail => detail.module.moduleLabors)));
  const totalCompositeAllowances = calculateAllowanceTotal(data.modulesComposite.flatMap(composite => composite.compositeDetails.flatMap(detail => detail.module.moduleLabors)));
  const totalCompositeHandlingCosts = calculateHandlingCostTotal(data.modulesComposite.flatMap(composite => composite.compositeDetails.flatMap(detail => detail.module.moduleMaterials)));
  const totalCompositeTaxes = calculateTaxTotal(data.modulesComposite.flatMap(composite => composite.compositeDetails.flatMap(detail => detail.module.moduleMaterials)));
  const totalProfit = (totalMaterials + totalLabor + totalCompositeMaterials + totalCompositeLabor) * profitMargin / 100;
  const grandTotal = totalMaterials + totalLabor + totalCompositeMaterials + totalCompositeLabor + totalProfit;

  return (
    <>
      <Paragraph>
        <InfoCircleOutlined style={{ marginRight: 8 }} />
        Here you review your project and fine-tune the costs. Please fill in the details below.
      </Paragraph>
      <Divider />
      <Row gutter={16} justify="center">
        {systemCostArray.map(system => (
          <Col key={system.systemName} span={6} style={{ textAlign: 'center' }}>
            <Progress type="circle" percent={parseFloat(system.percentage)} size={80} strokeColor={'#88b04d'}/>
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
          {data.modules.map((module) => {
            const totalMaterialCost = calculateTotal(module.moduleMaterials, 'unitPrice', 'quantity');
            const totalLaborCost = calculateLaborTotal(module.moduleLabors);
            return (
              <Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{module.moduleName}</span>
                    <span>Qty: {module.quantity} | Total: {((totalMaterialCost + totalLaborCost) * module.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                  </div>
                }
                key={module.moduleId}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Collapse>
                    <Panel header={
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>Materials</span>
                      <span>Total: {(totalMaterialCost).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>}
                      key={`materials_${module.moduleId}`}>
                      {module.moduleMaterials.map((material, index) => (
                        <div key={`material_${module.moduleId}_${material.projectMaterialId}_${index}`} style={{ marginBottom: '16px' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between', paddingBottom: 8 }}>
                            <span><b>{material.materialName}</b></span>
                            <span>Qty: {material.quantity}</span>
                          </Space>
                          <Row gutter={16}>
                            <Col span={12}>
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
                            </Col>
                            <Col span={12}>
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
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name={`material_${module.moduleId}_${material.projectMaterialId}_handlingCost_${index}`}
                                rules={[{ required: true, message: 'Please enter handling cost' }]}
                                style={{ margin: 0 }}
                                label="Handling Cost"
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={`material_${module.moduleId}_${material.projectMaterialId}_taxRate_${index}`}
                                rules={[{ required: true, message: 'Please enter tax rate' }]}
                                style={{ margin: 0 }}
                                label="Tax Rate"
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => `${value}%`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/%\s?|(,*)/g, '')}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </Panel>
                    <Panel header ={
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>Labor</span>
                      <span>Total: {(totalLaborCost).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>}>
                      {module.moduleLabors.map((labor, index) => (
                        <div key={`labor_${module.moduleId}_${labor.projectLaborId}_${index}`} style={{ marginBottom: '16px' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between', paddingBottom: 8 }}>
                            <span><b>{labor.laborType}</b></span>
                            <span>Qty: {labor.quantity}</span>
                          </Space>
                          <Row gutter={16}>
                            <Col span={16}>
                              <Form.Item
                                name={`labor_${module.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`}
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
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                name={`labor_${module.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`}
                                rules={[{ required: true, message: 'Please enter hours required' }]}
                                style={{ margin: 0 }}
                                label="Hours"
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/(,*)/g, '')}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={16}>
                              <Form.Item
                                name={`labor_${module.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`}
                                rules={[{ required: true, message: 'Please enter allowance amount' }]}
                                style={{ margin: 0 }}
                                label="Allowances"
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                name={`labor_${module.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`}
                                rules={[{ required: true, message: 'Please enter allowance quantity' }]}
                                style={{ margin: 0 }}
                                label="Days"
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/(,*)/g, '')}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </Panel>
                  </Collapse>
                </Space>
              </Panel>
            );
          })}
          {data.modulesComposite.map((composite) => (
            <Panel
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{composite.compositeName}</span>
                  <span>Qty: {composite.quantity} | Total: {calculateCompositeTotal(composite).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
              }
              key={composite.projectModuleCompositeId}
            >
              <Collapse>
                {composite.compositeDetails.map((detail) => {
                  const totalMaterialCost = calculateTotal(detail.module.moduleMaterials, 'unitPrice', 'quantity');
                  const totalLaborCost = calculateLaborTotal(detail.module.moduleLabors);
                  return (
                    <Panel
                      header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{detail.module.moduleName}</span>
                          <span>Qty: {detail.quantity} | Total: {((totalMaterialCost + totalLaborCost) * detail.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                      }
                      key={detail.moduleId}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Collapse>
                          <Panel 
                            header={
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span>Materials</span>
                                <span>Total: {totalMaterialCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                              </div>}>
                            {detail.module.moduleMaterials.map((material, index) => (
                              <div key={`material_${detail.moduleId}_${material.projectMaterialId}_${index}`} style={{ marginBottom: '16px' }}>
                                <Space style={{ width: '100%', justifyContent: 'space-between', paddingBottom: 8 }}>
                                  <span><b>{material.materialName}</b></span>
                                  <span>Qty: {material.quantity}</span>
                                </Space>
                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item
                                      name={`material_${detail.moduleId}_${material.projectMaterialId}_unitPrice_${index}`}
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
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item
                                      name={`material_${detail.moduleId}_${material.projectMaterialId}_cifPrice_${index}`}
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
                                  </Col>
                                </Row>
                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item
                                      name={`material_${detail.moduleId}_${material.projectMaterialId}_handlingCost_${index}`}
                                      rules={[{ required: true, message: 'Please enter handling cost' }]}
                                      style={{ margin: 0 }}
                                      label="Handling Cost"
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item
                                      name={`material_${detail.moduleId}_${material.projectMaterialId}_taxRate_${index}`}
                                      rules={[{ required: true, message: 'Please enter tax rate' }]}
                                      style={{ margin: 0 }}
                                      label="Tax Rate"
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}%`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/%\s?|(,*)/g, '')}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </div>
                            ))}
                          </Panel>
                          <Panel header ={
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                <span>Labor</span>
                                <span>Total: {(totalLaborCost).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                              </div>}>
                            {detail.module.moduleLabors.map((labor, index) => (
                              <div key={`labor_${detail.moduleId}_${labor.projectLaborId}_${index}`} style={{ marginBottom: '16px' }}>
                                <Space style={{ width: '100%', justifyContent: 'space-between', paddingBottom: 8 }}>
                                  <span><b>{labor.laborType}</b></span>
                                  <span>Qty: {labor.quantity}</span>
                                </Space>
                                <Row gutter={16}>
                                  <Col span={16}>
                                    <Form.Item
                                      name={`labor_${detail.moduleId}_${labor.projectLaborId}_hourlyRate_${index}`}
                                      rules={[{ required: true, message: 'Please enter hourly rate' }]}
                                      style={{ width: "100%" }}
                                      label="Hourly Rate"
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item
                                      name={`labor_${detail.moduleId}_${labor.projectLaborId}_hoursRequired_${index}`}
                                      rules={[{ required: true, message: 'Please enter hours required' }]}
                                      style={{ width: "100%" }}
                                      label="Hours"
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/(,*)/g, '')}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                                <Row gutter={16}>
                                  <Col span={16}>
                                    <Form.Item
                                      name={`labor_${detail.moduleId}_${labor.projectLaborId}_allowanceAmount_${index}`}
                                      rules={[{ required: true, message: 'Please enter allowance amount' }]}
                                      style={{ margin: 0 }}
                                      label="Allowances"
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item
                                      name={`labor_${detail.moduleId}_${labor.projectLaborId}_allowanceQuantity_${index}`}
                                      rules={[{ required: true, message: 'Please enter allowance quantity' }]}
                                      style={{ margin: 0 }}
                                      label="Days"
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        formatter={value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/(,*)/g, '')}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </div>
                            ))}
                          </Panel>
                        </Collapse>
                      </Space>
                    </Panel>
                  );
                })}
              </Collapse>
            </Panel>
          ))}
        </Collapse>
        <Divider/>
        <Row gutter={16} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12} style={{padding:8}}>
          <Card>
            <Statistic
              title="Total Materials"
              value={totalMaterials + totalCompositeMaterials || 'N/A'}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
            />
            <span style={{ fontSize: 10, color: 'gray' }}>Includes: {totalTaxes.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} taxes. </span><br/>
            <span style={{ fontSize: 10, color: 'gray' }}>       + {totalHandlingCosts.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} handling costs. </span>
          </Card>
        </Col>
        <Col xs={24} sm={12} style={{padding:8}}>
          <Card >
            <Statistic
              title="Total Labor"
              contentFontSize={16}
              value={totalLabor + totalCompositeLabor || 'N/A'}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
            />
            <span style={{ fontSize: 10, color: 'gray' }}>Includes: {totalAllowances.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} Allowances. </span><br/>
            <span style={{ fontSize: 10, color: 'gray' }}> Social Security </span>
          </Card>
        </Col>
      </Row>
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12} style={{padding:8}}>
          <Card>
            <Statistic
              title="Driving Distance"
              value={distance || 'N/A'}
              precision={2}
              valueStyle={{ color: '#000' }}
              suffix=" km"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} style={{padding:8}}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Statistic
                title="Profit %"
                value={profitMargin}
                precision={0}
                suffix="%"
              />
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 2, padding:0 }}>
                <Button
                  size="small"
                  onClick={() => {
                    const newProfitMargin = Math.min(profitMargin + 1, 100);
                    setProfitMargin(newProfitMargin);
                    form.setFieldsValue({ profitMargin: newProfitMargin });
                  }}
                >
                  +
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const newProfitMargin = Math.max(profitMargin - 1, 0);
                    setProfitMargin(newProfitMargin);
                    form.setFieldsValue({ profitMargin: newProfitMargin });
                  }}
                >
                  -
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12} style={{padding:8}}>
          <Card>
            <Statistic
              title="Total Profit"
              value={totalProfit}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} style={{padding:8}}>
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
        <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
          Save
        </Button>
      </div>
      </Form>
    </>
  );
};

const ProjectReview = ({ setLoading }) => {
  const [form] = Form.useForm();

  return (
    <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
      <ProjectReviewForm form={form} setLoading={setLoading} />
    </div>
  );
};

export default ProjectReview;
