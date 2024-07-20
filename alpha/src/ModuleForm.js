import React, { useEffect, useState, useCallback } from 'react';
import { Form, Button, Select, Space, InputNumber, TreeSelect, message, Input, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ModuleForm = ({ form, onCancel, isEditing, initialValues, fetchModules }) => {
  const [laborOptions, setLaborOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [systemOptions, setSystemOptions] = useState([]);
  const [materialUOMs, setMaterialUOMs] = useState({});
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const fetchLaborOptions = useCallback(async () => {
    try {
      const response = await axios.get('https://localhost:7115/api/labor');
      setLaborOptions(response.data);
    } catch (error) {
      console.error('Error fetching labor options:', error);
    }
  }, []);

  const fetchMaterialOptions = useCallback(async () => {
    try {
      const categoriesResponse = await axios.get('https://localhost:7115/api/categories');
      const materialsResponse = await axios.get('https://localhost:7115/api/materials');

      const categoryMap = categoriesResponse.data.reduce((acc, category) => {
        acc[category.categoryId] = {
          title: category.categoryName,
          value: `category-${category.categoryId}`,
          key: `category-${category.categoryId}`,
          children: [],
          selectable: false, // Make categories unselectable
        };
        return acc;
      }, {});

      materialsResponse.data.forEach(material => {
        if (categoryMap[material.categoryId]) {
          categoryMap[material.categoryId].children.push({
            title: material.materialName,
            value: material.materialId,
            key: material.materialId,
            uom: material.uom, // Store UOM directly in the material option
            selectable: true, // Make materials selectable
            className: 'product-node', // Add a custom class to product nodes
          });
        }
      });

      setMaterialOptions(Object.values(categoryMap));
    } catch (error) {
      console.error('Error fetching material options:', error);
    }
  }, []);

  const fetchSystemOptions = useCallback(async () => {
    try {
      const response = await axios.get('https://localhost:7115/api/system');
      setSystemOptions(response.data);
    } catch (error) {
      console.error('Error fetching system options:', error);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    await Promise.all([fetchLaborOptions(), fetchMaterialOptions(), fetchSystemOptions()]);
  }, [fetchLaborOptions, fetchMaterialOptions, fetchSystemOptions]);

  const fetchModuleDetails = useCallback(async (moduleId) => {
    setLoading(true);
    try {
      const [laborResponse, materialsResponse, moduleResponse] = await Promise.all([
        axios.get(`https://localhost:7115/api/moduleslabor/module/${moduleId}`),
        axios.get(`https://localhost:7115/api/modulematerials/module/${moduleId}`),
        axios.get(`https://localhost:7115/api/modules/${moduleId}`)
      ]);

      form.setFieldsValue({
        moduleId: moduleResponse.data.moduleId,
        moduleName: moduleResponse.data.moduleName,
        systemId: moduleResponse.data.systemId,
        description: moduleResponse.data.description,
        labor: Array.isArray(laborResponse.data) ? laborResponse.data.map(l => ({ laborId: l.laborId, hoursRequired: l.hoursRequired, quantity: l.quantity, moduleLaborId: l.moduleLaborId })) : [],
        materials: Array.isArray(materialsResponse.data) ? materialsResponse.data.map(m => ({ materialId: m.materialId, quantity: m.quantity, moduleMaterialId: m.moduleMaterialId })) : [],
      });

      // Set UOMs for materials from existing materialOptions
      const newMaterialUOMs = {};
      materialsResponse.data.forEach(material => {
        const materialOption = materialOptions.flatMap(option => option.children).find(opt => opt.value === material.materialId);
        if (materialOption) {
          newMaterialUOMs[material.materialId] = materialOption.uom;
        }
      });
      setMaterialUOMs(newMaterialUOMs);
    } catch (error) {
      console.error('Error fetching module details:', error);
      message.error('Failed to load module details');
    } finally {
      setLoading(false);
    }
  }, [form, materialOptions]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (isEditing && initialValues) {
      fetchModuleDetails(initialValues.moduleId);
    } else {
      form.resetFields();
    }
  }, [isEditing, initialValues, form, fetchModuleDetails]);

  const handleMaterialChange = useCallback((value, fieldKey) => {
    const materialOption = materialOptions.flatMap(option => option.children).find(opt => opt.value === value);
    if (materialOption) {
      const uom = materialOption.uom;
      setMaterialUOMs(prev => ({ ...prev, [value]: uom }));

      // Update only the specific material in the form state
      const updatedMaterials = form.getFieldValue('materials').map((material, index) => {
        if (index === fieldKey) {
          return { ...material, uom };
        }
        return material;
      });

      form.setFieldsValue({
        materials: updatedMaterials
      });
    }
  }, [form, materialOptions]);

  const onFinish = async (values) => {
    if (formSubmitted) return;
    setFormSubmitted(true);

    const { moduleId, moduleName, systemId, description, labor, materials } = values;
    const moduleData = {
      moduleId,
      projectId: initialValues?.projectId || 0,
      moduleName,
      moduleSystem: systemOptions.find(system => system.systemId === systemId)?.description || '',
      systemId,
      description,
      total: initialValues?.total || 0,
      moduleMaterials: materials.map(m => ({
        moduleMaterialId: m.moduleMaterialId || 0,
        moduleId,
        moduleName,
        materialId: m.materialId,
        materialName: materialOptions.flatMap(option => option.children).find(mat => mat.value === m.materialId)?.title || '',
        quantity: m.quantity,
      })),
      moduleLabors: labor.map(l => ({
        moduleLaborId: l.moduleLaborId || 0,
        moduleId,
        moduleName,
        laborId: l.laborId,
        laborType: laborOptions.find(lab => lab.laborId === l.laborId)?.laborType || '',
        hoursRequired: l.hoursRequired,
        hourlyRate: initialValues?.hourlyRate || 0,
        quantity: l.quantity,
      })),
    };

    try {
      setLoading(true);
      if (isEditing && initialValues) {
        await axios.put(`https://localhost:7115/api/modules/${initialValues.moduleId}`, moduleData);
        message.success('Module updated successfully');
      } else {
        await axios.post('https://localhost:7115/api/modules', moduleData);
        message.success('Module added successfully');
      }
      fetchModules();
      onCancel();
    } catch (error) {
      console.error('Error saving module:', error);
      message.error('Failed to save module');
    } finally {
      setLoading(false);
      setFormSubmitted(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        moduleId: initialValues?.moduleId || null,
        moduleName: initialValues?.moduleName || '',
        systemId: initialValues?.systemId || null,
        description: initialValues?.description || '',
        labor: initialValues?.moduleLabors || [],
        materials: initialValues?.moduleMaterials || []
      }}
    >
      {isEditing && (
        <Form.Item
          name="moduleId"
          hidden={true}
        >
          <Input type="hidden" />
        </Form.Item>
      )}

      {/* General Module Information Fields */}
      <Form.Item
        name="moduleName"
        label="Module Name"
        rules={[{ required: true, message: 'Please enter the module name' }]}
      >
        <Input placeholder="Please enter the module name" />
      </Form.Item>

      <Form.Item
        name="systemId"
        label="System"
        rules={[{ required: true, message: 'Please select a system' }]}
      >
        <Select placeholder="Select system">
          {systemOptions.map((system) => (
            <Option key={system.systemId} value={system.systemId}>
              {system.description}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter the description' }]}
      >
        <Input.TextArea placeholder="Please enter the description" />
      </Form.Item>

      <Form.List name="labor">
        {(fields, { add, remove }) => (
          <>
            <label>Labor</label>
            {fields.map(({ key, name, fieldKey, ...restField }, index) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                <Row gutter={16} style={{ width: '100%' }}>
                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, 'laborId']}
                      key={[fieldKey, 'laborId']}
                      rules={[{ required: true, message: 'Please select labor' }]}
                      label={index === 0 ? 'Type' : ''}
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
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      key={[fieldKey, 'quantity']}
                      label={index === 0 ? 'Qty' : ''}
                      rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                      <InputNumber placeholder="Quantity" max={999} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'hoursRequired']}
                      key={[fieldKey, 'hoursRequired']}
                      label={index === 0 ? 'Hours' : ''}
                      rules={[{ required: true, message: 'Please enter hours required' }]}
                    >
                      <InputNumber placeholder="Hours" max={999} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={1}>
                    <Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: index === 0 ? 30 : 0 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Space>
            ))}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Button
                onClick={() => add()}
                type='primary'
                shape="round"
                icon={<PlusOutlined />}
              >
                Add Labor
              </Button>
            </div>
          </>
        )}
      </Form.List>

      <Form.List name="materials">
        {(fields, { add, remove }) => (
          <>
            <label>Materials</label>
            {fields.map(({ key, name, fieldKey, ...restField }, index) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                <Row gutter={24} style={{ width: '100%' }}>
                  <Col span={16}>
                    <Form.Item
                      {...restField}
                      name={[name, 'materialId']}
                      key={[fieldKey, 'materialId']}
                      rules={[{ required: true, message: 'Please select material' }]}
                    >
                      <TreeSelect
                        placeholder="Select material"
                        treeData={materialOptions}
                        treeDefaultExpandAll
                        showSearch
                        style={{ minWidth: "16em" }} 
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
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      key={[fieldKey, 'quantity']}
                      rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                      <InputNumber placeholder="Qty" style={{ width: '100%' }} suffix={materialUOMs[form.getFieldValue(['materials', key, 'materialId'])]}/>
                    </Form.Item>
                  </Col>
                  <Col span={1}>
                    <Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: index === 0 ? 30 : 0 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Space>
            ))}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Button
                onClick={() => add()}
                shape="round"
                type="primary"
                icon={<PlusOutlined />}
              >
                Add Materials
              </Button>
            </div>
          </>
        )}
      </Form.List>

      <div style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" loading={loading} htmlType="submit">
          Save
        </Button>
      </div>
    </Form>
  );
};

export default ModuleForm;
