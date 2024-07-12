import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, InputNumber, Select, Card, Typography, Row, Col, message, Divider } from 'antd';
import moment from 'moment';
import axios from 'axios';
import GoogleMapsComponent from './GoogleMapsComponent'; // Adjust the import path as needed
import { GoogleOutlined, EnvironmentOutlined, InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Paragraph } = Typography;

const ProjectForm = ({ form, onSave, setLoading }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [clients, setClients] = useState([]);
  const [distributionCenters, setDistributionCenters] = useState([]);
  const [isEditMode, setIsEditMode] = useState(!!projectId);

  const baseURL = 'https://localhost:7115/api'; // Base URL for the API endpoints

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      message.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const fetchDistributionCenters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/distributionCenters`);
      setDistributionCenters(response.data);
    } catch (error) {
      console.error('Error fetching distribution centers:', error);
      message.error('Failed to load distribution centers');
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const fetchProjectDetails = useCallback(async (projectId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/projects/${projectId}`);
      const project = response.data;

      let lat = null, lng = null;
      if (project.locationCoordinates) {
        [lat, lng] = project.locationCoordinates.split(',').map(coord => parseFloat(coord.trim()));
      }

      form.setFieldsValue({
        project_name: project.projectName,
        description: project.description,
        start_date: moment(project.startDate),
        end_date: moment(project.endDate),
        client_id: project.clientId,
        distribution_center_id: project.distributionCenterId,
        total_area: project.totalArea,
        profit_margin: project.profitMargin,
      });

      if (project.location && project.locationAddress && lat !== null && lng !== null) {
        setLocation({
          name: project.location,
          address: project.locationAddress,
          lat,
          lng,
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      message.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [form, setLoading]);

  useEffect(() => {
    fetchClients();
    fetchDistributionCenters();
    if (projectId) {
      fetchProjectDetails(projectId);
    }
  }, [projectId, fetchProjectDetails, fetchClients, fetchDistributionCenters]);

  const handleSave = async (values) => {
    setLoading(true);
    const projectData = {
      projectId: projectId,
      projectName: values.project_name,
      description: values.description,
      startDate: values.start_date.format('YYYY-MM-DDTHH:mm:ss'),
      endDate: values.end_date.format('YYYY-MM-DDTHH:mm:ss'),
      clientId: values.client_id,
      distributionCenterId: values.distribution_center_id,
      totalArea: values.total_area,
      profitMargin: values.profit_margin,
      location: location ? location.name : '',
      locationAddress: location ? location.address : '',
      locationCoordinates: location ? `${location.lat},${location.lng}` : '',
    };

    try {
      if (projectId) {
        await axios.put(`${baseURL}/projects/${projectId}`, projectData);
        message.success('Project updated successfully');
      } else {
        const response = await axios.post(`${baseURL}/projects`, projectData);
        message.success('Project created successfully');
        setIsEditMode(true);
        navigate(`/projectedit/${response.data.projectId}`);
      }
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      message.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          start_date: moment(),
          end_date: moment().add(1, 'month'),
        }}
      >
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          Here you can add the basic information of the project. Please fill in the details below.
        </Paragraph>

        <Divider />
        <Form.Item
          name="project_name"
          label="Project Name"
          rules={[{ required: true, message: 'Please enter the project name' }]}
        >
          <Input placeholder="Enter project name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={4} placeholder="Enter project description" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="start_date"
              label="Start Date"
              rules={[{ required: true, message: 'Please select the start date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="end_date"
              label="End Date"
              rules={[{ required: true, message: 'Please select the end date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="client_id"
              label="Client"
              rules={[{ required: true, message: 'Please select a client' }]}
            >
              <Select placeholder="Select a client">
                {clients.map(client => (
                  <Option key={client.clientId} value={client.clientId}>{client.clientName}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="distribution_center_id"
              label="Distribution Center"
              rules={[{ required: true, message: 'Please select a distribution center' }]}
            >
              <Select placeholder="Select a distribution center">
                {distributionCenters.map(center => (
                  <Option key={center.distributionCenterId} value={center.distributionCenterId}>
                    {center.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="total_area"
              label="Total Area (m²)"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter total area" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="profit_margin"
              label="Profit Margin (%)"
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="Enter profit margin" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Location"
        >
          <Button type="primary" onClick={() => setLocationModalVisible(true)} icon={<GoogleOutlined />}>
            Select Location
          </Button>
          {location && (
            <Card style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <EnvironmentOutlined style={{ fontSize: '24px', marginRight: '10px' }} />
                <Text strong>{location.name}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>{location.address}</Text>
              <br />
              {location.lat !== null && location.lng !== null && (
                <Text type="secondary" style={{ fontSize: '12px' }}>Lat: {location.lat}, Lng: {location.lng}</Text>
              )}
            </Card>
          )}
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Save
            </Button>
          </div>
        </Form.Item>
      </Form>
      <GoogleMapsComponent
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};

export default ProjectForm;
