import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Button, Select, InputNumber, TreeSelect, message, Typography, Divider, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Paragraph, Title } = Typography;

const ProjectCostsForm = ({ form, projectId }) => {
  const [laborOptions, setLaborOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [bundleOptions, setBundleOptions] = useState([]);
  const [materialUOMs, setMaterialUOMs] = useState({});
  const [loading, setLoading] = useState(false);

  const baseURL = 'https://localhost:7115/api';

  const fetchLaborOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/labor`);
      setLaborOptions(response.data);
    } catch (error) {
      console.error('Error fetching labor options:', error);
      message.error('Failed to load labor options');
    }
  }, []);

  const fetchMaterialOptions = useCallback(async () => {
    try {
      const categoriesResponse = await axios.get(`${baseURL}/categories`);
      const materialsResponse = await axios.get(`${baseURL}/materials`);

      const categoryMap = categoriesResponse.data.reduce((acc, category) => {
        acc[category.categoryId] = {
          title: category.categoryName,
          value: `category-${category.categoryId}`,
          key: `category-${category.categoryId}`,
          children: [],
          selectable: false,
        };
        return acc;
      }, {});

      materialsResponse.data.forEach(material => {
        if (categoryMap[material.categoryId]) {
          categoryMap[material.categoryId].children.push({
            title: material.materialName,
            value: material.materialId,
            key: material.materialId,
            uom: material.uom,
            selectable: true,
            className: 'product-node',
          });
        }
      });

      setMaterialOptions(Object.values(categoryMap));
    } catch (error) {
      console.error('Error fetching material options:', error);
      message.error('Failed to load material options');
    }
  }, []);

  const fetchModuleOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/modules`);
      setModuleOptions(response.data);
    } catch (error) {
      console.error('Error fetching module options:', error);
      message.error('Failed to load module options');
    }
  }, []);

  const fetchBundleOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/modulescomposite`);
      setBundleOptions(response.data);
    } catch (error) {
      console.error('Error fetching bundle options:', error);
      message.error('Failed to load bundle options');
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    await Promise.all([fetchLaborOptions(), fetchMaterialOptions(), fetchModuleOptions(), fetchBundleOptions()]);
  }, [fetchLaborOptions, fetchMaterialOptions, fetchModuleOptions, fetchBundleOptions]);

  const fetchProjectCosts = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/projectdetails/${projectId}`);
      const projectCosts = response.data;

      form.setFieldsValue({
        labor: projectCosts.projectLabor.map(l => ({
          laborId: l.laborId,
          quantity: l.quantity
        })),
        materials: projectCosts.projectMaterials.map(m => ({
          materialId: m.materialId,
          quantity: m.quantity,
          uom: m.uom
        })),
        modules: projectCosts.projectModules.map(m => ({
          moduleId: m.moduleId,
          quantity: m.quantity
        })),
        bundles: projectCosts.projectModuleComposites.map(b => ({
          bundleId: b.moduleCompositeId,
          quantity: b.quantity
        }))
      });

    } catch (error) {
      console.error('Error fetching project costs:', error);
      message.error('Failed to load project costs');
    }
  }, [form, projectId]);

  useEffect(() => {
    fetchOptions();
    fetchProjectCosts();
  }, [fetchOptions, fetchProjectCosts]);

  const handleMaterialChange = useCallback((value, fieldKey) => {
    const materialOption = materialOptions.flatMap(option => option.children).find(opt => opt.value === value);
    if (materialOption) {
      const uom = materialOption.uom;
      setMaterialUOMs(prev => ({ ...prev, [value]: uom }));

      const materials = form?.getFieldValue('materials') || [];
      const updatedMaterials = materials.map((material, index) => {
        if (index === fieldKey) {
          return { ...material, uom };
        }
        return material;
      });

      form?.setFieldsValue({
        materials: updatedMaterials
      });
    }
  }, [form, materialOptions]);

  const handleSubmit = async (values) => {
    setLoading(true);

    const payload = {
      projectId: projectId,
      projectLabor: values.labor?.map(l => ({
        projectLaborId: 0,
        projectId: projectId,
        laborId: l.laborId,
        hourlyRate: 0,
        quantity: l.quantity,
        moduleId: 0
      })) || [],
      projectModules: values.modules?.map(m => ({
        projectModuleId: 0,
        projectId: projectId,
        moduleId: m.moduleId,
        quantity: m.quantity
      })) || [],
      projectMaterials: values.materials?.map(m => ({
        projectMaterialId: 0,
        projectId: projectId,
        materialId: m.materialId,
        unitPrice: 0,
        taxStatus: "string",
        cifPrice: 0,
        lastModified: new Date().toISOString(),
        quantity: m.quantity,
        moduleId: 0
      })) || [],
      projectModuleComposites: values.bundles?.map(b => ({
        projectModuleCompositeId: 0,
        projectId: projectId,
        moduleCompositeId: b.bundleId,
        quantity: b.quantity
      })) || []
    };

    try {
      await axios.post(`${baseURL}/projectdetails/${projectId}`, payload);
      message.success('Project costs saved successfully!');
      fetchProjectCosts();
    } catch (error) {
      console.error('Error saving project costs:', error);
      message.error('Failed to save project costs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: 600 }}
    >
      <Paragraph>
        <InfoCircleOutlined style={{ marginRight: 8 }} />
        This step is for adding labor, materials, modules, and bundles to calculate project costs. Please fill in the details below.
      </Paragraph>

      <Divider />

      <Title level={4}>Labor</Title>
      <Form.List name="labor">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Row key={key} gutter={24} align="middle" style={{ marginBottom: 16 }}>
                <Col span={13}>
                  <Form.Item
                    {...restField}
                    name={[name, 'laborId']}
                    fieldKey={[fieldKey, 'laborId']}
                    rules={[{ required: true, message: 'Please select labor' }]}
                  >
                    <Select placeholder="Select labor" style={{ width: '100%' }}>
                      {laborOptions.map((labor) => (
                        <Option key={labor.laborId} value={labor.laborId}>
                          {labor.laborType}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    fieldKey={[fieldKey, 'quantity']}
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <InputNumber placeholder="Quantity" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6} style={{ fontSize: 12 }}>
                  hours <MinusCircleOutlined onClick={() => remove(name)} />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button
                onClick={() => add()}
                type="primary"
                shape="round"
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Add Labor
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider />

      <Title level={4}>Materials</Title>
      <Form.List name="materials">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Row key={key} gutter={24} align="middle" style={{ marginBottom: 16 }}>
                <Col span={13}>
                  <Form.Item
                    {...restField}
                    name={[name, 'materialId']}
                    fieldKey={[fieldKey, 'materialId']}
                    rules={[{ required: true, message: 'Please select material' }]}
                  >
                    <TreeSelect
                      placeholder="Select material"
                      treeData={materialOptions}
                      treeDefaultExpandAll
                      showSearch
                      style={{ width: '100%' }}
                      filterTreeNode={(input, treeNode) =>
                        treeNode.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      onChange={(value) => handleMaterialChange(value, key)}
                      treeNodeFilterProp="title"
                      treeNodeLabelProp="title"
                      className={(node) => (node.className ? node.className : '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    fieldKey={[fieldKey, 'quantity']}
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <InputNumber placeholder="Quantity" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6} style={{ fontSize: 12 }}>
                  {materialUOMs[form?.getFieldValue(['materials', key, 'materialId'])]} <MinusCircleOutlined onClick={() => remove(name)} />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button
                onClick={() => add()}
                shape="round"
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Add Materials
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider />

      <Title level={4}>Modules</Title>
      <Form.List name="modules">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Row key={key} gutter={24} align="middle" style={{ marginBottom: 16 }}>
                <Col span={13}>
                  <Form.Item
                    {...restField}
                    name={[name, 'moduleId']}
                    fieldKey={[fieldKey, 'moduleId']}
                    rules={[{ required: true, message: 'Please select module' }]}
                  >
                    <Select placeholder="Select module" style={{ width: '100%' }}>
                      {moduleOptions.map((module) => (
                        <Option key={module.moduleId} value={module.moduleId}>
                          {module.moduleName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    fieldKey={[fieldKey, 'quantity']}
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <InputNumber placeholder="Quantity" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6} style={{ fontSize: 12 }}>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button
                onClick={() => add()}
                shape="round"
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Add Modules
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider />

      <Title level={4}>Bundles</Title>
      <Form.List name="bundles">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Row key={key} gutter={24} align="middle" style={{ marginBottom: 16 }}>
                <Col span={13}>
                  <Form.Item
                    {...restField}
                    name={[name, 'bundleId']}
                    fieldKey={[fieldKey, 'bundleId']}
                    rules={[{ required: true, message: 'Please select bundle' }]}
                  >
                    <Select placeholder="Select bundle" style={{ width: '100%' }}>
                      {bundleOptions.map((bundle) => (
                        <Option key={bundle.moduleCompositeId} value={bundle.moduleCompositeId}>
                          {bundle.compositeName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    fieldKey={[fieldKey, 'quantity']}
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <InputNumber placeholder="Quantity" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6} style={{ fontSize: 12 }}>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button
                onClick={() => add()}
                shape="round"
                type="primary"
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Add Bundles
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider />

      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Button type="primary" loading={loading} htmlType="submit">
          Save
        </Button>
      </div>
    </Form>
  );
};

export default ProjectCostsForm;
