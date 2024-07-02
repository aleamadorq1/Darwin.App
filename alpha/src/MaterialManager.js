// src/MaterialManager.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Input, Button, Space, Popconfirm, message, Drawer, Form, Typography, Divider  } from 'antd';
import axios from 'axios';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import MaterialForm from './MaterialForm';

const { Title, Text } = Typography;

const MaterialManager = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/materials/index');
      setMaterials(response.data);
    } catch (error) {
      console.error('There was an error fetching the materials!', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://localhost:7115/api/categories');
      const treeData = buildTreeData(response.data);
      setCategories(treeData);
    } catch (error) {
      console.error('There was an error fetching the categories!', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('https://localhost:7115/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('There was an error fetching the suppliers!', error);
    }
  };

  const buildTreeData = (categories, parentId = null) => {
    return categories
      .filter(category => category.parentCategoryId === parentId)
      .map(category => ({
        title: category.categoryName,
        value: category.categoryId,
        key: category.categoryId,
        children: buildTreeData(categories, category.categoryId),
      }));
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
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
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
        onFilterDropdownOpenChange: visible => {
      if (visible) {
        setTimeout(() => searchInputRef.current.select(), 100);
      }
    },
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters) => {
    clearFilters();
  };

  const handleDelete = async (materialId) => {
    try {
      await axios.delete(`https://localhost:7115/api/materials/${materialId}`);
      message.success('Material deleted successfully');
      fetchMaterials(); // Refresh the materials list
    } catch (error) {
      console.error('There was an error deleting the material!', error);
      message.error('Failed to delete material');
    }
  };

  const handleEdit = (material) => {
    setIsEditing(true);
    setSelectedMaterial(material);
    form.setFieldsValue(material);
    setDrawerVisible(true);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedMaterial(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (isEditing && selectedMaterial) {
        await axios.put(`https://localhost:7115/api/materials/${selectedMaterial.materialId}`, {
          ...values,
          materialId: selectedMaterial.materialId,
        });
        message.success('Material updated successfully');
      } else {
        await axios.post('https://localhost:7115/api/materials', values);
        message.success('Material added successfully');
      }
      setDrawerVisible(false);
      fetchMaterials();
    } catch (error) {
      console.error('There was an error saving the material!', error);
      message.error('Failed to save material');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'materialName',
      key: 'materialName',
      ...getColumnSearchProps('materialName'),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      responsive: ['md'],
      ...getColumnSearchProps('sku'),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      responsive: ['md'],
      ...getColumnSearchProps('category'),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      ...getColumnSearchProps('supplier'),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (text) => `$${text.toFixed(2)}`,
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      key: 'uom',
      responsive: ['md'],
    },
    {
      title: 'Tax Status',
      dataIndex: 'taxStatus',
      responsive: ['md'],
      key: 'taxStatus',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this material?"
            onConfirm={() => handleDelete(record.materialId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Materials Management</Title>
      <Text>
        Use this page to manage the Materials. You can add, edit, and delete materials to be used in Modules.
      </Text>
      <Divider />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Create Material
      </Button>
      <Table
        dataSource={materials}
        columns={columns}
        rowKey="materialId"
        loading={loading}
      />
      <Drawer
        title={isEditing ? 'Edit Material' : 'Add Material'}
        width={400}
        onClose={handleDrawerClose}
        open={drawerVisible}
      >
        <MaterialForm
          form={form}
          categories={categories}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
          onCancel={handleDrawerClose}
          isEditing={isEditing}
        />
      </Drawer>
    </div>
  );
};

export default MaterialManager;
