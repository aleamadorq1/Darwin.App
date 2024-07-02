// src/CategoryManager.js
import React, { useEffect, useState } from 'react';
import { Tree, Button, Drawer, Form, Input, message, Popconfirm, Typography, Divider } from 'antd';
import axios from 'axios';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log('Selected Category changed:', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    console.log('Drawer Visible changed:', drawerVisible);
  }, [drawerVisible]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('There was an error fetching the categories!', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (categories, parentId = null) => {
    const children = categories
      .filter(category => category.parentCategoryId === parentId)
      .map(category => ({
        title: (
          <div>
            <span>{category.categoryName}</span>
            <span style={{ marginLeft: 8 }}>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(category)}
                style={{ marginRight: 8 }}
              />
              <Popconfirm
                title="Are you sure you want to delete this category?"
                onConfirm={() => handleDelete(category.categoryId)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" icon={<DeleteOutlined />} />
              </Popconfirm>
            </span>
          </div>
        ),
        key: category.categoryId,
        children: buildTreeData(categories, category.categoryId),
      }));

    if (parentId === null) {
      children.unshift({
        title: (
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => handleAdd(null)}
            style={{ paddingLeft: 0 }}
          >
            Add Category
          </Button>
        ),
        key: 'add-top-level',
      });
    } else {
      children.unshift({
        title: (
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => handleAdd(parentId)}
            style={{ paddingLeft: 0 }}
          >
            Add Category
          </Button>
        ),
        key: `add-${parentId}`,
      });
    }

    return children;
  };

  const handleAdd = (parentId = null) => {
    setIsEditing(false);
    setParentCategoryId(parentId);
    setSelectedCategory(null); // Clear selected category for adding
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (category) => {
    setIsEditing(true);
    setSelectedCategory(category);
    setParentCategoryId(category.parentCategoryId);
    console.log('Editing Category:', category);
    form.setFieldsValue({
      categoryName: category.categoryName,
    });
    setDrawerVisible(true);
  };

  const handleDelete = async (categoryId) => {
    setLoading(true);
    try {
      console.log(`Deleting category with ID: ${categoryId}`);
      await axios.delete(`https://localhost:7115/api/categories/${categoryId}`);
      message.success('Category deleted successfully');
      setSelectedCategory(null); // Clear the selected category after deletion
      fetchCategories();
    } catch (error) {
      console.error('There was an error deleting the category!', error);
      message.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerOk = async () => {
    try {
      const values = await form.validateFields();
      const newCategory = {
        ...values,
        parentCategoryId: parentCategoryId || null,
      };
      console.log('Selected Category in handleDrawerOk:', selectedCategory);
      if (isEditing) {
        if (!selectedCategory || !selectedCategory.categoryId) {
          throw new Error('Selected category is not properly set.');
        }
        await axios.put(`https://localhost:7115/api/categories/${selectedCategory.categoryId}`, {
          categoryId: selectedCategory.categoryId,
          ...newCategory,
        });
        message.success('Category updated successfully');
      } else {
        await axios.post('https://localhost:7115/api/categories', newCategory);
        message.success('Category added successfully');
      }
      setDrawerVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('There was an error saving the category!', error);
      message.error(`Failed to save category: ${error.message}`);
    }
  };

  const handleDrawerCancel = () => {
    setDrawerVisible(false);
  };

  const treeData = buildTreeData(categories);

  const handleSelect = (selectedKeys, { selectedNodes }) => {
    if (selectedNodes.length > 0) {
      const { key, title } = selectedNodes[0];
      const categoryName = Array.isArray(title.props.children)
        ? title.props.children.find(child => typeof child === 'string')
        : title.props.children;
      const parentCategoryId = selectedNodes[0].parentId || null;
      const newSelectedCategory = {
        categoryId: key,
        categoryName: categoryName || '',
        parentCategoryId: parentCategoryId,
      };
      console.log('New Selected Category:', newSelectedCategory);
      setSelectedCategory(newSelectedCategory);
    }
  };

  return (
    <div>
      <Title level={2}>Category Management</Title>
      <Text>
        Use this page to manage the categories of materials. You can add, edit, and delete categories, and organize them hierarchically.
      </Text>
      <Divider />
      <Tree
        treeData={treeData}
        loading={loading}
        style={{ padding: 10 }}
        onSelect={handleSelect}
      />
      <Drawer
        title={isEditing ? 'Edit Category' : 'Add Category'}
        open={drawerVisible}
        onClose={handleDrawerCancel}
        width={400}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleDrawerCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button onClick={handleDrawerOk} type="primary">
              Save
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="categoryName"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter the category name' }]}
          >
            <Input placeholder="Please enter the category name" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default CategoryManager;
