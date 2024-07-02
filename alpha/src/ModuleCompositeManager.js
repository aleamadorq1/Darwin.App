// src/ModuleCompositeManager.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Input, Button, Space, Popconfirm, message, Drawer, Form, Typography, Divider } from 'antd';
import axios from 'axios';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import ModuleCompositeForm from './ModuleCompositeForm';

const { Title, Text } = Typography;

const ModuleCompositeManager = () => {
  const [moduleComposites, setModuleComposites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModuleComposite, setSelectedModuleComposite] = useState(null);
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchModuleComposites();
  }, []);

  const fetchModuleComposites = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/modulescomposite');
      setModuleComposites(response.data);
    } catch (error) {
      console.error('There was an error fetching the module composites!', error);
    } finally {
      setLoading(false);
    }
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
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const handleDelete = async (moduleCompositeId) => {
    try {
      await axios.delete(`https://localhost:7115/api/modulescomposite/${moduleCompositeId}`);
      message.success('Module Composite deleted successfully');
      fetchModuleComposites(); // Refresh the module composites list
    } catch (error) {
      console.error('There was an error deleting the module composite!', error);
      message.error('Failed to delete module composite');
    }
  };

  const handleEdit = (moduleComposite) => {
    setIsEditing(true);
    setSelectedModuleComposite(moduleComposite);
    form.setFieldsValue(moduleComposite);
    setDrawerVisible(true);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedModuleComposite(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'compositeName',
      key: 'compositeName',
      ...getColumnSearchProps('compositeName'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this module composite?"
            onConfirm={() => handleDelete(record.moduleCompositeId)}
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
      <Title level={2}>Module Composites Configuration</Title>
      <Text>
        Use this page to manage the Module Composites. You can add, edit, and delete Module Composites.
      </Text>
      <Divider />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Create Module Composite
      </Button>
      <Table
        dataSource={moduleComposites}
        columns={columns}
        rowKey="moduleCompositeId"
        loading={loading}
      />
      <Drawer
        title={isEditing ? 'Edit Module Composite' : 'Add Module Composite'}
        width={600}
        onClose={handleDrawerClose}
        open={drawerVisible}
      >
        <ModuleCompositeForm
          form={form}
          onCancel={handleDrawerClose}
          fetchModuleComposites={fetchModuleComposites}
          isEditing={isEditing}
          initialValues={selectedModuleComposite}
        />
      </Drawer>
    </div>
  );
};

export default ModuleCompositeManager;
