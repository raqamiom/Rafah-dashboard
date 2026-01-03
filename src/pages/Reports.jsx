import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';

// Mock chart component - would be replaced with a real chart library like Recharts
const MockChart = ({ type, height = 300 }) => {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        borderRadius: 1,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      {type === 'bar' && <BarChartIcon fontSize="large" color="primary" />}
      {type === 'pie' && <PieChartIcon fontSize="large" color="secondary" />}
      {type === 'line' && <TimelineIcon fontSize="large" color="info" />}
      {type === 'table' && <TableChartIcon fontSize="large" color="warning" />}
      <Typography sx={{ ml: 1 }}>
        {type.charAt(0).toUpperCase() + type.slice(1)} Chart Visualization
      </Typography>
    </Box>
  );
};

const Reports = () => {
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('occupancy');
  
  // State for date range
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // State for report type
  const [reportType, setReportType] = useState('monthly');
  
  // State for export format
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle date change
  const handleDateChange = (field, value) => {
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };
  
  // Handle report type change
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };
  
  // Handle export format change
  const handleExportFormatChange = (event) => {
    setExportFormat(event.target.value);
  };
  
  // Handle generate report
  const handleGenerateReport = (type) => {
    // Generate report logic would go here
    showSuccess(t('reports.generated', { type }));
  };
  
  // Handle export report
  const handleExportReport = () => {
    // Export report logic would go here
    showSuccess(t('reports.exported', { format: exportFormat.toUpperCase() }));
  };
  
  // Handle print report
  const handlePrintReport = () => {
    // Print report logic would go here
    showSuccess(t('reports.printed'));
  };
  
  // Report categories
  const reportCategories = [
    {
      id: 'occupancy',
      title: t('reports.occupancy.title'),
      description: t('reports.occupancy.description'),
      icon: <HomeIcon fontSize="large" color="primary" />,
      reports: [
        {
          id: 'occupancyRate',
          title: t('reports.occupancy.occupancyRate'),
          type: 'bar',
        },
        {
          id: 'roomTypeDistribution',
          title: t('reports.occupancy.roomTypeDistribution'),
          type: 'pie',
        },
        {
          id: 'occupancyTrend',
          title: t('reports.occupancy.occupancyTrend'),
          type: 'line',
        },
      ],
    },
    {
      id: 'financial',
      title: t('reports.financial.title'),
      description: t('reports.financial.description'),
      icon: <AttachMoneyIcon fontSize="large" color="success" />,
      reports: [
        {
          id: 'revenueByMonth',
          title: t('reports.financial.revenueByMonth'),
          type: 'bar',
        },
        {
          id: 'paymentStatus',
          title: t('reports.financial.paymentStatus'),
          type: 'pie',
        },
        {
          id: 'financialSummary',
          title: t('reports.financial.summary'),
          type: 'table',
        },
      ],
    },
    {
      id: 'student',
      title: t('reports.student.title'),
      description: t('reports.student.description'),
      icon: <PeopleIcon fontSize="large" color="info" />,
      reports: [
        {
          id: 'studentDemographics',
          title: t('reports.student.demographics'),
          type: 'pie',
        },
        {
          id: 'studentRegistrations',
          title: t('reports.student.activityRegistrations', 'Activity Registrations'),
          type: 'line',
        },
        {
          id: 'studentList',
          title: t('reports.student.list'),
          type: 'table',
        },
      ],
    },
    {
      id: 'operations',
      title: t('reports.operations.title'),
      description: t('reports.operations.description'),
      icon: <AssignmentIcon fontSize="large" color="warning" />,
      reports: [
        {
          id: 'maintenanceRequests',
          title: t('reports.operations.maintenanceRequests'),
          type: 'bar',
        },
        {
          id: 'serviceUsage',
          title: t('reports.operations.serviceUsage'),
          type: 'pie',
        },
        {
          id: 'checkoutRate',
          title: t('reports.operations.checkoutRate'),
          type: 'line',
        },
      ],
    },
  ];
  
  // Get current category
  const currentCategory = reportCategories.find(category => category.id === currentTab) || reportCategories[0];
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageHeader
        title={t('reports.title')}
      />
      
      <Grid container spacing={3}>
        {/* Left sidebar - Report categories */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('reports.categories')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Tabs
              orientation="vertical"
              value={currentTab}
              onChange={handleTabChange}
              sx={{ 
                borderRight: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': { 
                  alignItems: 'flex-start',
                  textAlign: 'left',
                },
              }}
            >
              {reportCategories.map((category) => (
                <Tab 
                  key={category.id}
                  value={category.id}
                  label={category.title}
                  icon={category.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('reports.filters')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('reports.reportType')}</InputLabel>
              <Select
                value={reportType}
                onChange={handleReportTypeChange}
                label={t('reports.reportType')}
              >
                <MenuItem value="daily">{t('reports.daily')}</MenuItem>
                <MenuItem value="weekly">{t('reports.weekly')}</MenuItem>
                <MenuItem value="monthly">{t('reports.monthly')}</MenuItem>
                <MenuItem value="quarterly">{t('reports.quarterly')}</MenuItem>
                <MenuItem value="yearly">{t('reports.yearly')}</MenuItem>
                <MenuItem value="custom">{t('reports.custom')}</MenuItem>
              </Select>
            </FormControl>
            
            <DatePicker
              label={t('reports.startDate')}
              value={startDate}
              onChange={(date) => handleDateChange('start', date)}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
            
            <DatePicker
              label={t('reports.endDate')}
              value={endDate}
              onChange={(date) => handleDateChange('end', date)}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => handleGenerateReport(currentCategory.title)}
              sx={{ mt: 2 }}
            >
              {t('reports.generate')}
            </Button>
          </Paper>
        </Grid>
        
        {/* Main content - Reports */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                {currentCategory.title} {t('reports.reports')}
              </Typography>
              
              <Box>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
                  <InputLabel id="export-format-label">{t('reports.format')}</InputLabel>
                  <Select
                    labelId="export-format-label"
                    value={exportFormat}
                    onChange={handleExportFormatChange}
                    label={t('reports.format')}
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
                
                <Tooltip title={t('reports.export')}>
                  <IconButton onClick={handleExportReport} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('reports.print')}>
                  <IconButton onClick={handlePrintReport}>
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              {currentCategory.description}
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {currentCategory.reports.map((report) => (
                <Grid item xs={12} key={report.id}>
                  <Card>
                    <CardHeader 
                      title={report.title}
                      action={
                        <Tooltip title={t('reports.download')}>
                          <IconButton onClick={() => handleExportReport()}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    />
                    <CardContent>
                      <MockChart type={report.type} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('reports.savedReports')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {[1, 2, 3, 4].map((item) => (
                <ListItem 
                  key={item}
                  divider={item < 4}
                  secondaryAction={
                    <Box>
                      <Tooltip title={t('reports.download')}>
                        <IconButton edge="end" onClick={() => handleExportReport()}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('reports.print')}>
                        <IconButton edge="end" onClick={() => handlePrintReport()}>
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${t('reports.monthlySummary')} - ${format(new Date(2023, item - 1, 1), 'MMMM yyyy')}`}
                    secondary={`${t('reports.generated')}: ${format(new Date(2023, item, 5), 'MMM dd, yyyy')}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default Reports; 