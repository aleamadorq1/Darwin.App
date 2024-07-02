// src/ClientFormDrawer.js
import React, { useEffect } from 'react';
import { Drawer, Form, Button, Input, message } from 'antd';
import axios from 'axios';

const ClientForm = ({ visible, onClose, client, onSave }) => {
    const [form] = Form.useForm();

  useEffect(() => {
    if (client) {
      form.setFieldsValue(client);
    } else {
      form.resetFields();
    }
  }, [client, form]);

  const handleFinish = async (values) => {
    try {
      if (client) {
        // Update client
        const updatedValues = { ...values, clientId: client.clientId };
        await axios.put(`https://localhost:7115/api/clients/${client.clientId}`, updatedValues);
        message.success('Client updated successfully');
      } else {
        // Create new client
        await axios.post('https://localhost:7115/api/clients', values);
        message.success('Client created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('There was an error saving the client!', error);
      message.error('Failed to save client');
    }
  };

  return (
    <Drawer
      title={client ? 'Edit Client' : 'Create Client'}
      width={720}
      onClose={onClose}
      open={visible}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="clientName"
          label="Client Name"
          rules={[{ required: true, message: 'Please enter the client name' }]}
        >
          <Input placeholder="Please enter the client name" />
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
            {client ? 'Update' : 'Create'}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ClientForm;
