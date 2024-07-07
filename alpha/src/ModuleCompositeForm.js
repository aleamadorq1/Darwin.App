// src/ModuleCompositeForm.js
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Space, InputNumber, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ModuleCompositeForm = ({ form, onCancel, isEditing, initialValues, fetchModuleComposites }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModules();
    if (isEditing && initialValues) {
      const moduleDetails = (initialValues.moduleCompositeDetails || []).map(detail => ({
        moduleCompositeDetailId: detail.moduleCompositeDetailId,
        moduleId: detail.moduleId,
        moduleName: detail.moduleName,
        quantity: detail.quantity,
      }));
      form.setFieldsValue({
        compositeName: initialValues.compositeName,
        description: initialValues.description,
        moduleCompositeDetails: moduleDetails,
      });
    } else {
      form.resetFields();
    }
  }, [isEditing, initialValues]);

  const fetchModules = async () => {
    try {
      const response = await axios.get('https://localhost:7115/api/modules');
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      message.error('Failed to load modules');
    }
  };

  const onFinish = async (values) => {
    const moduleCompositeData = {
      ...values,
      moduleCompositeId: isEditing ? initialValues.moduleCompositeId : 0,
      moduleCompositeDetails: values.moduleCompositeDetails.map((detail, index) => ({
        moduleCompositeDetailId: isEditing ? initialValues.moduleCompositeDetails?.[index]?.moduleCompositeDetailId || 0 : 0,
        moduleId: detail.moduleId,
        moduleName: modules.find(module => module.moduleId === detail.moduleId).moduleName,
        quantity: detail.quantity,
      })),
    };

    try {
      setLoading(true);
      if (isEditing && initialValues) {
        await axios.put(`https://localhost:7115/api/modulescomposite/${initialValues.moduleCompositeId}`, moduleCompositeData);
        message.success('Module Composite updated successfully');
      } else {
        await axios.post('https://localhost:7115/api/modulescomposite', moduleCompositeData);
        message.success('Module Composite added successfully');
      }
      fetchModuleComposites();
      onCancel();
    } catch (error) {
      console.error('Error saving module composite:', error);
      message.error('Failed to save module composite');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    form.submit();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="compositeName"
        label="Composite Name"
        rules={[{ required: true, message: 'Please enter the composite name' }]}
      >
        <Input placeholder="Please enter the composite name" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter the description' }]}
      >
        <Input.TextArea placeholder="Please enter the description" />
      </Form.Item>

      <Form.List name="moduleCompositeDetails">
        {(fields, { add, remove }) => (
          <>
            <label>Modules</label>
            {fields.map(({ key, name, fieldKey, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'moduleId']}
                  fieldKey={[fieldKey, 'moduleId']}
                  rules={[{ required: true, message: 'Please select a module' }]}
                >
                  <Select
                    placeholder="Select module"
                    style={{ width: 400 }}
                    showSearch
                    optionFilterProp="children"
                  >
                    {modules.map((module) => (
                      <Option key={module.moduleId} value={module.moduleId}>
                        {module.moduleName}
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
                  <InputNumber min={1} placeholder="Quantity" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginBottom: 10 }}>
              Add Module
            </Button>
          </>
        )}
      </Form.List>

      <div style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" loading={loading} onClick={handleFormSubmit}>
          Save
        </Button>
      </div>
    </Form>
  );
};

export default ModuleCompositeForm;
