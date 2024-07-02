// src/ModuleManager.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Input, Button, Space, Popconfirm, message, Drawer, Form, Typography, Divider } from 'antd';
import axios from 'axios';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import ModuleForm from './ModuleForm';

const { Title, Text } = Typography;

const ModuleManager = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/modules');
      setModules(response.data);
    } catch (error) {
      console.error('There was an error fetching the modules!', error);
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
  };

  const handleReset = (clearFilters) => {
    clearFilters();
  };

  const handleDelete = async (moduleId) => {
    try {
      await axios.delete(`https://localhost:7115/api/modules/${moduleId}`);
      message.success('Module deleted successfully');
      fetchModules(); // Refresh the modules list
    } catch (error) {
      console.error('There was an error deleting the module!', error);
      message.error('Failed to delete module');
    }
  };

  const handleEdit = (module) => {
    setIsEditing(true);
    setSelectedModule(module);
    form.setFieldsValue(module);
    setDrawerVisible(true);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedModule(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'moduleName',
      key: 'moduleName',
      ...getColumnSearchProps('moduleName'),
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this module?"
            onConfirm={() => handleDelete(record.moduleId)}
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
      <Title level={2}>Modules Configuration</Title>
      <Text>
        Use this page to manage the Modules. You can add, edit, and delete Modules.
      </Text>
      <Divider />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Create Module
      </Button>
      <Table
        dataSource={modules}
        columns={columns}
        rowKey="moduleId"
        loading={loading}
      />
      <Drawer
        title={isEditing ? 'Edit Module' : 'Add Module'}
        width={600}
        onClose={handleDrawerClose}
        open={drawerVisible}
      >
        <ModuleForm
          form={form}
          onCancel={handleDrawerClose}
          fetchModules={fetchModules}
          isEditing={isEditing}
          initialValues={selectedModule}
        />
      </Drawer>
    </div>
  );
};

export default ModuleManager;
