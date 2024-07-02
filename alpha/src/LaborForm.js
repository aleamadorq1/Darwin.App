// src/LaborForm.js
import React, { useEffect } from 'react';
import { Form, Input, Button } from 'antd';

const LaborForm = ({ form, onSubmit, onCancel, isEditing }) => {
  useEffect(() => {
    if (!isEditing) {
      form.resetFields();
    }
  }, [form, isEditing]);

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="laborType"
        label="Labor Type"
        rules={[{ required: true, message: 'Please enter the labor type' }]}
      >
        <Input placeholder="Please enter the labor type" />
      </Form.Item>
      <Form.Item
        name="hourlyRate"
        label="Hourly Rate"
        rules={[{ required: true, message: 'Please enter the hourly rate' }]}
      >
        <Input type="number" placeholder="Please enter the hourly rate" />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter the description' }]}
      >
        <Input placeholder="Please enter the description" />
      </Form.Item>
      <div style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </div>
    </Form>
  );
};

export default LaborForm;
