import React, { useState, useEffect } from 'react';
import { Layout, Menu, Drawer, Button, Avatar, Typography } from 'antd';
import { MenuUnfoldOutlined, UserOutlined, NotificationOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './MainLayout.css'; // Import CSS for custom styling

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleMenuClick = () => {
    if (isMobile) {
      closeDrawer();
    }
  };

  const menuItems = [
    {
      key: 'sub1',
      icon: <UserOutlined />,
      label: 'Start',
      children: [
        { key: '1', label: <Link to="/">Home</Link> },
        { key: '2', label: <Link to="/projectedit">New Project</Link> },
      ],
    },
    {
      key: 'sub3',
      icon: <NotificationOutlined />,
      label: 'Configuration',
      children: [
        { key: '3', label: <Link to="/categories">Categories</Link> },
        { key: '4', label: <Link to="/materials">Materials</Link> },
        { key: '5', label: <Link to="/labor">Labor</Link> },
        { key: '6', label: <Link to="/module">Module</Link> },
        { key: '7', label: <Link to="/modulecomposite">Module Composite</Link> },
        { key: '8', label: <Link to="/clients">Clients</Link> },
        { key: '9', label: <Link to="/suppliers">Suppliers</Link> },
      ],
    },
  ];

  const userInfo = (
    <div style={{ backgroundColor: '#001529', padding: '16px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar size={48} icon={<UserOutlined />} style={{ marginRight: '16px' }} />
        <div style={{ textAlign: 'left' }}>
          <Text strong style={{ color: '#fff' }}>John Doe</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px', color: '#aaa' }}>john.doe@example.com</Text>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
        <HomeOutlined style={{ marginRight: '4px', color: '#aaa', paddingLeft:"65px" }} />
        <Text style={{ color: '#fff', fontSize: '12px'}}>Organization Name</Text>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo" />
        {isMobile ? (
          <Button
            className="menu-button"
            type="primary"
            onClick={showDrawer}
            style={{ marginLeft: 'auto' }}
          >
            <MenuUnfoldOutlined />
          </Button>
        ) : (
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', label: <Link to="/">Home</Link> },
              { key: '2', label: <Link to="/modules">Clients</Link> },
            ]}
          />
        )}
      </Header>
      <Layout>
        {!isMobile && (
          <Sider
            width={300}
            className="site-layout-background"
            collapsible
            collapsed={collapsed}
            onCollapse={toggleCollapsed}
            breakpoint="md"
            collapsedWidth="0"
          >
            {userInfo}
            <Menu mode="inline" theme="dark" defaultSelectedKeys={['1']} style={{ height: '100%', borderRight: 0 }} items={menuItems} />
          </Sider>
        )}
        {isMobile && (
          <Drawer
            placement="left"
            closable={false} // Remove the close button
            onClose={closeDrawer}
            open={drawerVisible}
            className="custom-drawer"
            styles={{
              header: { display: 'none' }, // Hide the header
              body: { backgroundColor: '#001529', padding: 0 } // Set background color
            }}
          >
            {userInfo}
            <Menu mode="inline" theme="dark" defaultSelectedKeys={['1']} style={{ height: '100%', borderRight: 0 }} items={menuItems} onClick={handleMenuClick} />
          </Drawer>
        )}
        <Layout style={{ padding: '0 24px 24px' }}>
          <div className="container">
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              {children}
            </Content>
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
