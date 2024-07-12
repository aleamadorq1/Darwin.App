import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { EnvironmentOutlined, GoogleOutlined, SaveOutlined } from '@ant-design/icons';
import GoogleMapsComponent from './GoogleMapsComponent'; // Ensure it's the wrapped version

const { Text } = Typography;

const DistributionCenterForm = ({ form, onSubmit, onCancel, isEditing, selectedCenter }) => {
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (isEditing && selectedCenter) {
      const { location, locationAddress, locationCoordinates } = selectedCenter;
      console.log('Form values on edit:', selectedCenter); // Debugging log
      if (location && locationAddress && locationCoordinates) {
        const [lat, lng] = locationCoordinates.split(',').map(Number);
        setLocation({ name: location, address: locationAddress, lat, lng });
        form.setFieldsValue({
          location,
          locationAddress,
          locationCoordinates,
        });
      }
    } else {
      form.resetFields();
      setLocation(null);
    }
  }, [form, isEditing, selectedCenter]);

  const handleLocationSelect = (selectedLocation) => {
    console.log('Selected location:', selectedLocation); // Debugging log
    setLocation(selectedLocation);
    form.setFieldsValue({
      location: selectedLocation.name,
      locationAddress: selectedLocation.address,
      locationCoordinates: `${selectedLocation.lat},${selectedLocation.lng}`,
    });
  };

  return (
    <>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter the name' }]}
        >
          <Input placeholder="Please enter the name" />
        </Form.Item>
        <Form.Item
          name="location"
          label="Location"
        >
          <div>
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
          </div>
        </Form.Item>
        <Form.Item
          name="locationAddress"
          label="Location Address"
          hidden
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="locationCoordinates"
          label="Location Coordinates"
          hidden
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
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

export default DistributionCenterForm;
