import React, { useEffect, useState, useCallback } from 'react';
import { Form, Button, Select, Space, InputNumber, TreeSelect, message, Input } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ModuleForm = ({ form, onCancel, isEditing, initialValues, fetchModules }) => {
  const [laborOptions, setLaborOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
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

  const fetchOptions = useCallback(async () => {
    await Promise.all([fetchLaborOptions(), fetchMaterialOptions()]);
  }, [fetchLaborOptions, fetchMaterialOptions]);

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
        moduleType: moduleResponse.data.moduleType,
        description: moduleResponse.data.description,
        labor: Array.isArray(laborResponse.data) ? laborResponse.data.map(l => ({ laborId: l.laborId, quantity: l.hoursRequired })) : [],
        materials: Array.isArray(materialsResponse.data) ? materialsResponse.data.map(m => ({ materialId: m.materialId, quantity: m.quantity })) : [],
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

    const { moduleId, moduleName, moduleType, description, labor, materials } = values;
    const moduleData = {
      moduleId,
      moduleName,
      moduleType,
      description,
      ModulesLabors: labor.map(l => ({
        moduleId,
        laborId: l.laborId,
        hoursRequired: l.quantity,
      })),
      ModulesMaterials: materials.map(m => ({
        moduleId,
        materialId: m.materialId,
        quantity: m.quantity,
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
        moduleType: initialValues?.moduleType || '',
        description: initialValues?.description || '',
        labor: initialValues?.ModulesLabors || [],
        materials: initialValues?.ModulesMaterials || []
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
        name="moduleType"
        label="Module Type"
        rules={[{ required: true, message: 'Please enter the module type' }]}
      >
        <Input placeholder="Please enter the module type" />
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
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'laborId']}
                  fieldKey={[fieldKey, 'laborId']}
                  rules={[{ required: true, message: 'Please select labor' }]}
                >
                  <Select placeholder="Select labor" style={{ width: 200 }}>
                    {laborOptions.map((labor) => (
                      <Option key={labor.laborId} value={labor.laborId}>
                        {labor.laborType}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'quantity']}
                  fieldKey={[fieldKey, 'quantity']}
                  rules={[{ required: true, message: 'Please enter quantity' }]}
                >
                  <InputNumber placeholder="Quantity" />
                </Form.Item>
                <span>hours</span>
                <MinusCircleOutlined onClick={() => remove(name)} />
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
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
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
                    style={{ width: 200 }}
                    filterTreeNode={(input, treeNode) =>
                      treeNode.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={(value) => handleMaterialChange(value, key)}
                    treeNodeFilterProp="title"
                    treeNodeLabelProp="title"
                    className={(node) => (node.className ? node.className : '')}
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'quantity']}
                  fieldKey={[fieldKey, 'quantity']}
                  rules={[{ required: true, message: 'Please enter quantity' }]}
                >
                  <InputNumber placeholder="Quantity" />
                </Form.Item>
                <span>{materialUOMs[form.getFieldValue(['materials', key, 'materialId'])]}</span>
                <MinusCircleOutlined onClick={() => remove(name)} />
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
