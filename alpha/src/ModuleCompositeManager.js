// src/SupplierList.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Popconfirm, message, Typography, Divider, Input, Space } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import SupplierForm from './SupplierForm';

const { Title, Text } = Typography;

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const searchInputRef = useRef(null);

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

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInputRef.current?.select(), 100);
      }
    },
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    fetchSuppliers(); // Reset to fetch all suppliers
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
      ...getColumnSearchProps('supplierName'),
      style: { width: "20em" },
    },
    {
      title: 'Contact Info',
      dataIndex: 'contactInfo',
      key: 'contactInfo',
      responsive: ['md'], // Hide on small screens
      ...getColumnSearchProps('contactInfo'),
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
