// src/SupplierForm.js
import React, { useEffect } from 'react';
import { Drawer, Form, Button, Input, message } from 'antd';
import axios from 'axios';

const SupplierForm = ({ visible, onClose, supplier, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (supplier) {
      form.setFieldsValue(supplier);
    } else {
      form.resetFields();
    }
  }, [supplier, form]);

  const handleFinish = async (values) => {
    try {
      if (supplier) {
        // Update supplier
        const updatedValues = { ...values, supplierId: supplier.supplierId };
        await axios.put(`https://localhost:7115/api/suppliers/${supplier.supplierId}`, updatedValues);
        message.success('Supplier updated successfully');
      } else {
        // Create new supplier
        await axios.post('https://localhost:7115/api/suppliers', values);
        message.success('Supplier created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('There was an error saving the supplier!', error);
      message.error('Failed to save supplier');
    }
  };

  return (
    <Drawer
      title={supplier ? 'Edit Supplier' : 'Create Supplier'}
      width={720}
      onClose={onClose}
      open={visible}
      styles={{ paddingBottom: 80 }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="supplierName"
          label="Supplier Name"
          rules={[{ required: true, message: 'Please enter the supplier name' }]}
        >
          <Input placeholder="Please enter the supplier name" />
        </Form.Item>
        <Form.Item
          name="contactInfo"
          label="Contact Info"
          rules={[{ required: true, message: 'Please enter the contact info' }]}
        >
          <Input placeholder="Please enter the contact info" />
        </Form.Item>
        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter the address' }]}
        >
          <Input placeholder="Please enter the address" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {supplier ? 'Update' : 'Create'}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default SupplierForm;
