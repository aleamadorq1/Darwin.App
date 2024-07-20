import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, TreeSelect } from 'antd';
import axios from 'axios';

const { Option } = Select;

const MaterialForm = ({ form, categories, suppliers, taxRates, handlingCosts, onSubmit, onCancel, isEditing }) => {

  useEffect(() => {
    if (!isEditing) {
      form.resetFields();
    }

  }, [form, isEditing]);

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="materialName"
        label="Material Name"
        rules={[{ required: true, message: 'Please enter the material name' }]}
      >
        <Input placeholder="Please enter the material name" />
      </Form.Item>
      <Form.Item
        name="sku"
        label="SKU"
        rules={[{ required: true, message: 'Please enter the SKU' }]}
      >
        <Input placeholder="Please enter the SKU" />
      </Form.Item>
      <Form.Item
        name="categoryId"
        label="Category"
        rules={[{ required: true, message: 'Please select a category' }]}
      >
        <TreeSelect
          placeholder="Please select a category"
          treeData={categories}
          treeDefaultExpandAll
        />
      </Form.Item>
      <Form.Item
        name="supplierId"
        label="Supplier"
        rules={[{ required: true, message: 'Please select a supplier' }]}
      >
        <Select placeholder="Please select a supplier">
          {suppliers.map(supplier => (
            <Option key={supplier.supplierId} value={supplier.supplierId}>
              {supplier.supplierName}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        name="unitPrice"
        label="Unit Price"
        rules={[{ required: true, message: 'Please enter the unit price' }]}
      >
        <Input type="number" placeholder="Please enter the unit price" />
      </Form.Item>
      <Form.Item
        name="uom"
        label="Unit of Measure"
        rules={[{ required: true, message: 'Please enter the unit of measure' }]}
      >
        <Input placeholder="Please enter the unit of measure" />
      </Form.Item>
      <Form.Item
        name="taxRateId"
        label="Tax Rate"
        rules={[{ required: true, message: 'Please select a tax rate' }]}
      >
        <Select placeholder="Please select a tax rate">
          {taxRates.map(taxRate => (
            <Option key={taxRate.taxRateId} value={taxRate.taxRateId}>
              {taxRate.description}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        name="handlingCostId"
        label="Handling Cost"
        rules={[{ required: true, message: 'Please select a handling cost' }]}
      >
        <Select placeholder="Please select a handling cost">
          {handlingCosts.map(handlingCost => (
            <Option key={handlingCost.handlingCostId} value={handlingCost.handlingCostId}>
              {handlingCost.description}
            </Option>
          ))}
        </Select>
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

export default MaterialForm;
