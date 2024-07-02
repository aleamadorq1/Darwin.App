// src/SupplierList.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, message, Typography, Divider } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import SupplierForm from './SupplierForm';

const { Title, Text } = Typography;

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error("There was an error fetching the suppliers!", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setDrawerVisible(true);
  };

  const handleDelete = async (supplierId) => {
    setLoading(true);
    try {
      await axios.delete(`https://localhost:7115/api/suppliers/${supplierId}`);
      message.success('Supplier deleted successfully');
      fetchSuppliers(); // Refresh the list after deletion
    } catch (error) {
      console.error("There was an error deleting the supplier!", error);
      message.error('Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    fetchSuppliers(); // Refresh the list after save
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Contact Info',
      dataIndex: 'contactInfo',
      key: 'contactInfo',
      responsive: ['md'], // Hide on small screens
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      responsive: ['md'],
      render: (text) => new Date(text).toLocaleString(), // Assume the date is already a valid ISO string or timestamp
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: 8 }} />
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record.supplierId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <Title level={2}>Supplier Management</Title>
      <Text>
        Use this page to manage the Suppliers. You can add, edit, and delete suppliers.
      </Text>
      <Divider />
      <Button type="primary" onClick={() => handleEdit(null)} style={{ marginBottom: 16 }}>
        Create Supplier
      </Button>
      <Table
        dataSource={suppliers}
        columns={columns}
        rowKey="supplierId"
        loading={loading}
      />
      <SupplierForm
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        supplier={selectedSupplier}
        onSave={handleSave}
      />
    </>
  );
};

export default SupplierList;
