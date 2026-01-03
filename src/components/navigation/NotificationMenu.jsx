import React, { useState } from 'react';
import { 
  Badge,
  IconButton, 
  Menu, 
  MenuItem, 
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Tooltip,
  Button
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns';

// Mock notifications
const mockNotifications = [
  {
    id: '1',
    title: 'New Registration',
    message: 'A new student has registered and is pending approval.',
    date: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    type: 'registration'
  },
  {
    id: '2',
    title: 'Payment Received',
    message: 'Payment #PAY20230001 has been successfully processed.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    type: 'payment'
  },
  {
    id: '3',
    title: 'Contract Expiring',
    message: 'Contract #CTR20230015 is expiring in 7 days.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    type: 'contract'
  },
  {
    id: '4',
    title: 'Maintenance Request',
    message: 'New maintenance request for Room A-101.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    read: true,
    type: 'maintenance'
  }
];

const NotificationMenu = () => {
  const { t } = useLanguage();
  
  const [notifications, setNotifications] = useState(mockNotifications);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleMarkAsRead = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Format the notification time
  const formatNotificationTime = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000 * 60) {
      return t('common.justNow');
    } else if (diff < 1000 * 60 * 60) {
      const minutes = Math.floor(diff / (1000 * 60));
      return t('common.minutesAgo', { count: minutes });
    } else if (diff < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return t('common.hoursAgo', { count: hours });
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };
  
  return (
    <>
      <Tooltip title={t('common.notifications')}>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? 'notification-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? (
              <NotificationsIcon />
            ) : (
              <NotificationsNoneIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('common.notifications')}
          </Typography>
          
          {unreadCount > 0 && (
            <Button 
              size="small" 
              color="primary" 
              onClick={handleMarkAllAsRead}
            >
              {t('common.markAllAsRead')}
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('common.noNotifications')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <MenuItem 
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{ 
                  px: 2, 
                  py: 1.5,
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: notification.read ? 'action.hover' : 'action.selected',
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight={notification.read ? 'normal' : 'bold'}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotificationTime(notification.date)}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
            ))}
          </List>
        )}
        
        <Divider />
        
        <Box sx={{ textAlign: 'center', p: 1 }}>
          <Button size="small">
            {t('common.viewAll')}
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationMenu; 