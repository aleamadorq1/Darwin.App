import React, { useState, useEffect } from 'react';
import { Typography, Divider, List, Card, Row, Col, Tooltip, Avatar, Spin, Input } from 'antd';
import { FileAddTwoTone, FileTextTwoTone, FileWordTwoTone, FileExcelTwoTone, FilePptTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import sunImage from './assets/sun.png'; // Path to your sun image
import moonImage from './assets/moon.png'; // Path to your moon image

const { Title, Text } = Typography;
const { Search } = Input;

const HomePage = () => {
  const [recentProjects, setRecentProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [image, setImage] = useState(sunImage); // Default to sun image
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Determine the current hour
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      setImage(sunImage); // Set sun image for daytime
    } else {
      setImage(moonImage); // Set moon image for nighttime
    }

    // Fetch recent projects from the API
    fetch('https://localhost:7115/api/projects') // Replace with your actual API endpoint
      .then(response => response.json())
      .then(data => {
        console.log('Fetched projects:', data); // Log the data fetched
        if (Array.isArray(data)) {
          setRecentProjects(data);
        } else {
          console.error('Unexpected response format:', data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        setLoading(false);
      });
  }, []);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const filteredProjects = recentProjects
    .filter(project => project.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const projectCards = [
    {
      title: 'New Project',
      icon: <FileAddTwoTone style={{ fontSize: '48px', margin: '24px 0' }} />,
      description: 'Create a new project',
      onClick: () => navigate('/projectedit'), // Navigate to project creation
    },
    {
      title: 'Word Template',
      icon: <FileWordTwoTone style={{ fontSize: '48px', margin: '24px 0' }} />,
      description: 'Use a Word template',
      responsive: ['md'],
    },
    {
      title: 'Excel Template',
      icon: <FileExcelTwoTone style={{ fontSize: '48px', margin: '24px 0' }} />,
      description: 'Use an Excel template',
      responsive: ['md'],
    },
    {
      title: 'PowerPoint Template',
      icon: <FilePptTwoTone style={{ fontSize: '48px', margin: '24px 0' }} />,
      description: 'Use a PowerPoint template',
      responsive: ['md'],
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={image} alt="time of day" style={{ width: 40, height: 40, marginRight: 10 }} />
        <Title level={2}>Welcome, User</Title>
      </div>
      <Divider />
      <Row gutter={[8, 16]} justify="start">
        {projectCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Tooltip title={card.description}>
              <Card
                hoverable
                style={{ width: '100%', textAlign: 'center' }}
                cover={card.icon}
                onClick={card.onClick}
              >
                <Card.Meta title={card.title} />
              </Card>
            </Tooltip>
          </Col>
        ))}
      </Row>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Recent Projects</Title>
        <Search
          placeholder="Search projects"
          onSearch={handleSearch}
          style={{ width: 200 }}
        />
      </div>
      {loading ? (
        <Spin size="large" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filteredProjects}
          renderItem={item => {
            // Check if item is defined and contains the expected properties
            if (!item || typeof item !== 'object' || !item.projectName || !item.clientName) {
              console.error('Invalid item:', item); // Log the invalid item
              return null;
            }
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={<FileTextTwoTone style={{ fontSize: '24px' }} />}
                  title={<Link to={`/projectedit/${item.projectId}`}>{item.projectName}</Link>}
                  description={<Text type="secondary" style={{ fontSize: '12px' }}>Client: {item.clientName}</Text>}
                  style={{ marginRight: 10, flex: 1 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
                  <Avatar>{item.clientName[0]}</Avatar>
                  <div style={{ display: 'inline-block', marginLeft: 10 }}>
                    <Text strong>{item.clientName}</Text>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default HomePage;
