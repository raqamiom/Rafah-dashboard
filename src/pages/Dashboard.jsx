import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  Alert,
  Stack,
  Chip,
  LinearProgress,
  Fade,
  Zoom,
  Skeleton,
  Container,
  Badge,
} from '@mui/material';
import {
  People as PeopleIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  MoreVert as MoreVertIcon,
  Restaurant as RestaurantIcon,
  Build as BuildIcon,
  Event as EventIcon,
  ExitToApp as ExitToAppIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { alpha } from '@mui/material/styles';
import PageHeader from '../components/common/PageHeader';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/dashboard/StatCard';
import { Query } from 'appwrite';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const Dashboard = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { databases, databaseId, collections } = useAppWrite();
  const { user } = useAuth();
  
  // Range filter
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dashboard data
  const [stats, setStats] = useState({
    totalStudents: 0,
    occupancyRate: 0,
    availableRooms: 0,
    activeContracts: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    recentFoodOrders: 0,
    activeCheckoutRequests: 0,
  });

  const [chartData, setChartData] = useState({
    occupancyTrend: null,
    revenueData: null,
    roomStatusData: null,
    paymentStatusData: null,
  });

  const [recentActivities, setRecentActivities] = useState([]);

  // Enhanced statistics cards configuration
  const statsCards = useMemo(() => [
    {
      title: t('dashboard.kpi.totalStudents') || 'Total Students',
      value: stats.totalStudents,
      icon: PeopleIcon,
      color: 'primary',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.9)})`,
      delay: 100,
    },
    {
      title: t('dashboard.kpi.occupancyRate') || 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: HomeIcon,
      color: 'success',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
      delay: 200,
      subtitle: 'Capacity utilization',
    },
    {
      title: t('dashboard.kpi.availableRooms') || 'Available Spaces',
      value: stats.availableRooms,
      icon: HomeIcon,
      color: 'info',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.8)}, ${alpha(theme.palette.info.dark, 0.9)})`,
      delay: 300,
      subtitle: 'Rooms with space',
    },
    {
      title: t('dashboard.kpi.activeContracts') || 'Active Contracts',
      value: stats.activeContracts,
      icon: DescriptionIcon,
      color: 'warning',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.8)}, ${alpha(theme.palette.warning.dark, 0.9)})`,
      delay: 400,
    },
    {
      title: t('dashboard.kpi.pendingPayments') || 'Pending Payments',
      value: stats.pendingPayments,
      icon: PaymentIcon,
      color: 'error',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.8)}, ${alpha(theme.palette.error.dark, 0.9)})`,
      delay: 500,
    },
    {
      title: t('dashboard.kpi.totalRevenue') || 'Total Revenue',
      value: `${stats.totalRevenue.toLocaleString()} OMR`,
      icon: MonetizationOnIcon,
      color: 'success',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
      delay: 600,
    },
    {
      title: t('dashboard.kpi.recentFoodOrders') || 'Food Orders',
      value: stats.recentFoodOrders,
      icon: RestaurantIcon,
      color: 'info',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.8)}, ${alpha(theme.palette.info.dark, 0.9)})`,
      delay: 700,
    },
    {
      title: t('dashboard.kpi.activeCheckouts') || 'Checkout Requests',
      value: stats.activeCheckoutRequests,
      icon: ExitToAppIcon,
      color: 'warning',
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.8)}, ${alpha(theme.palette.warning.dark, 0.9)})`,
      delay: 800,
    }
  ], [stats, theme.palette, t]);

  // Helper function to get month labels based on time range
  const getTimeLabels = (range) => {
    const labels = [];
    const now = new Date();
    let periods = 12;
    
    switch (range) {
      case 'week':
        periods = 7;
        for (let i = periods - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
        }
        break;
      case 'quarter':
        periods = 4;
        for (let i = periods - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - (i * 3));
          labels.push(`Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`);
        }
        break;
      case 'year':
        periods = 5;
        for (let i = periods - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setFullYear(date.getFullYear() - i);
          labels.push(date.getFullYear().toString());
        }
        break;
      default: // month
        periods = 12;
        for (let i = periods - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          labels.push(date.toLocaleDateString('en', { month: 'short' }));
        }
    }
    
    return { labels, periods };
  };

  // Helper function to get date ranges for historical data
  const getDateRanges = (range) => {
    const now = new Date();
    const ranges = [];
    let periods = 12;
    
    switch (range) {
      case 'week':
        periods = 7;
        for (let i = periods - 1; i >= 0; i--) {
          const start = new Date(now);
          start.setDate(start.getDate() - i);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setHours(23, 59, 59, 999);
          ranges.push({ start, end });
        }
        break;
      case 'quarter':
        periods = 4;
        for (let i = periods - 1; i >= 0; i--) {
          const start = new Date(now);
          start.setMonth(start.getMonth() - (i * 3));
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setMonth(end.getMonth() + 3);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
          ranges.push({ start, end });
        }
        break;
      case 'year':
        periods = 5;
        for (let i = periods - 1; i >= 0; i--) {
          const start = new Date(now);
          start.setFullYear(start.getFullYear() - i);
          start.setMonth(0);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + 1);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
          ranges.push({ start, end });
        }
        break;
      default: // month
        periods = 12;
        for (let i = periods - 1; i >= 0; i--) {
          const start = new Date(now);
          start.setMonth(start.getMonth() - i);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
          ranges.push({ start, end });
        }
    }
    
    return ranges;
  };
  
  // Calculate room status and occupancy details based on active contracts (same logic as Rooms page)
  const calculateRoomStatus = async (room, activeContractsResponse) => {
    try {
      // If room is manually set to maintenance, keep it
      if (room.status === 'maintenance') {
        return { 
          status: 'maintenance', 
          activeContractsCount: 0, 
          remainingSpace: room.capacity 
        };
      }
      
      // Count active contracts for this room
      const activeContractsCount = activeContractsResponse.documents.filter(contract => {
        return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(room.$id);
      }).length;
      
      // Calculate remaining space
      const remainingSpace = Math.max(0, room.capacity - activeContractsCount);
      
      // Determine status based on occupancy - automatic calculation
      let status;
      if (activeContractsCount === 0) {
        status = 'not_occupied';
      } else if (activeContractsCount >= room.capacity) {
        status = 'full';
      } else {
        status = 'remaining_space';
      }
      
      return { status, activeContractsCount, remainingSpace };
    } catch (error) {
      console.error('Error calculating room status:', error);
      // Default to not_occupied if error
      return { 
        status: 'not_occupied', 
        activeContractsCount: 0, 
        remainingSpace: room.capacity 
      };
    }
  };

  // Optimized data fetching with memoization
  const fetchDashboardData = useMemo(() => async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on timeRange
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
      }

      // Batch queries for better performance
      const basicQueriesPromise = Promise.all([
        databases.listDocuments(databaseId, collections.users, [Query.equal('role', 'student')]),
        databases.listDocuments(databaseId, collections.rooms),
        databases.listDocuments(databaseId, collections.contracts, [Query.equal('status', 'active')]),
        databases.listDocuments(databaseId, collections.payments, [Query.equal('status', 'pending')]),
        databases.listDocuments(databaseId, collections.checkoutRequests, [Query.equal('status', 'pending')]),
      ]);

      const timeBasedQueriesPromise = Promise.all([
        databases.listDocuments(databaseId, collections.payments, [
          Query.greaterThan('createdAt', startDate.toISOString()),
          Query.equal('status', 'paid')
        ]),
        databases.listDocuments(databaseId, collections.foodOrders, [
          Query.greaterThan('createdAt', startDate.toISOString())
        ]),
      ]);

      const recentActivitiesPromise = Promise.all([
        databases.listDocuments(databaseId, collections.payments, [
          Query.orderDesc('createdAt'),
          Query.limit(5)
        ]),
        databases.listDocuments(databaseId, collections.contracts, [
          Query.orderDesc('createdAt'),
          Query.limit(3)
        ]),
        databases.listDocuments(databaseId, collections.foodOrders, [
          Query.orderDesc('createdAt'),
          Query.limit(3)
        ]),
        databases.listDocuments(databaseId, collections.checkoutRequests, [
          Query.orderDesc('createdAt'),
          Query.limit(3)
        ]),
      ]);

      // Execute queries in batches for faster loading
      const [basicResults, timeBasedResults, recentResults] = await Promise.all([
        basicQueriesPromise,
        timeBasedQueriesPromise,
        recentActivitiesPromise
      ]);

      const [
        studentsResponse,
        roomsResponse,
        activeContractsResponse,
        pendingPaymentsResponse,
        checkoutRequestsResponse,
      ] = basicResults;

      const [
        paymentsResponse,
        foodOrdersResponse,
      ] = timeBasedResults;

      const [
        recentPaymentsResponse,
        recentContractsResponse,
        recentFoodOrdersResponse,
        recentCheckoutResponse,
      ] = recentResults;

      // Calculate statistics efficiently with new room status logic
      const totalStudents = studentsResponse.total;
      const totalRooms = roomsResponse.total;
      
      // Calculate room statuses using the same logic as Rooms page
      const roomsWithStatus = await Promise.all(
        roomsResponse.documents.map(async (room) => {
          const statusData = await calculateRoomStatus(room, activeContractsResponse);
          return {
            ...room,
            calculatedStatus: statusData.status,
            activeContractsCount: statusData.activeContractsCount,
            remainingSpace: statusData.remainingSpace
          };
        })
      );
      
      // Count rooms by new status categories
      const notOccupiedRooms = roomsWithStatus.filter(room => room.calculatedStatus === 'not_occupied').length;
      const remainingSpaceRooms = roomsWithStatus.filter(room => room.calculatedStatus === 'remaining_space').length;
      const fullRooms = roomsWithStatus.filter(room => room.calculatedStatus === 'full').length;
      const maintenanceRooms = roomsWithStatus.filter(room => room.calculatedStatus === 'maintenance').length;
      
      // Available rooms = not occupied + rooms with remaining space
      const availableRooms = notOccupiedRooms + remainingSpaceRooms;
      
      // Occupancy rate based on occupied capacity vs total capacity
      const totalCapacity = roomsWithStatus.reduce((sum, room) => sum + room.capacity, 0);
      const occupiedCapacity = roomsWithStatus.reduce((sum, room) => sum + room.activeContractsCount, 0);
      const occupancyRate = totalCapacity > 0 
        ? Math.round((occupiedCapacity / totalCapacity) * 100) 
        : 0;
      
      const activeContracts = activeContractsResponse.total;
      const pendingPayments = pendingPaymentsResponse.total;
      
      const totalRevenue = paymentsResponse.documents
        .reduce((sum, payment) => sum + (payment.finalAmount || payment.amount || 0), 0);
      
      const recentFoodOrders = foodOrdersResponse.total;
      const activeCheckoutRequests = checkoutRequestsResponse.total;

      // Update stats immediately for faster perceived performance
      setStats({
        totalStudents,
        occupancyRate,
        availableRooms,
        activeContracts,
        pendingPayments,
        totalRevenue,
        recentFoodOrders,
        activeCheckoutRequests,
        // Additional room breakdown for enhanced insights
        totalCapacity,
        occupiedCapacity,
        notOccupiedRooms,
        remainingSpaceRooms,
        fullRooms,
        maintenanceRooms,
      });

      // Load charts data separately to avoid blocking initial render
      setChartsLoading(true);
      setTimeout(async () => {
        try {
          // Fetch historical data for charts
          const [allPaymentsResponse, allContractsResponse] = await Promise.all([
            databases.listDocuments(databaseId, collections.payments, [
              Query.equal('status', 'paid'),
              Query.limit(1000)
            ]),
            databases.listDocuments(databaseId, collections.contracts, [
              Query.limit(1000)
            ])
          ]);

          // Prepare chart data with new room status categories
          const roomStatusDistribution = {
            not_occupied: notOccupiedRooms,
            remaining_space: remainingSpaceRooms,
            full: fullRooms,
            maintenance: maintenanceRooms,
          };

          const paymentStatusDistribution = {
            paid: allPaymentsResponse.documents.filter(p => p.status === 'paid').length,
            pending: pendingPaymentsResponse.documents.length,
            failed: allPaymentsResponse.documents.filter(p => p.status === 'failed').length,
          };

          // Generate real historical data
          const { labels } = getTimeLabels(timeRange);
          const dateRanges = getDateRanges(timeRange);

          // Calculate real monthly revenue data
          const revenueMonthlyData = dateRanges.map(({ start, end }) => {
            return allPaymentsResponse.documents
              .filter(payment => {
                const paymentDate = new Date(payment.paidDate || payment.createdAt);
                return paymentDate >= start && paymentDate <= end && payment.status === 'paid';
              })
              .reduce((sum, payment) => sum + (payment.finalAmount || payment.amount || 0), 0);
          });

          // Calculate real occupancy trend data based on capacity utilization
          const occupancyTrendData = dateRanges.map(({ start, end }) => {
            const activeContractsInPeriod = allContractsResponse.documents.filter(contract => {
              const contractStart = new Date(contract.startDate);
              const contractEnd = new Date(contract.endDate);
              return contractStart <= end && contractEnd >= start && contract.status === 'active';
            }).length;

            // Calculate occupancy rate based on total capacity instead of total rooms
            const totalCapacity = roomsWithStatus.reduce((sum, room) => sum + room.capacity, 0);
            return totalCapacity > 0 ? Math.round((activeContractsInPeriod / totalCapacity) * 100) : 0;
          });

          setChartData({
            occupancyTrend: {
              labels,
              datasets: [{
                label: t('dashboard.charts.occupancyTrend') || 'Occupancy Trend',
                data: occupancyTrendData,
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                tension: 0.4,
                fill: true,
                pointBackgroundColor: theme.palette.primary.main,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
              }],
            },
            revenueData: {
              labels,
              datasets: [{
                label: t('dashboard.charts.monthlyRevenue') || 'Monthly Revenue',
                data: revenueMonthlyData,
                backgroundColor: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${alpha(theme.palette.secondary.main, 0.7)})`,
                borderColor: theme.palette.secondary.main,
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
              }],
            },
            roomStatusData: {
              labels: [
                t('rooms.status.not_occupied') || 'Not Occupied',
                t('rooms.status.remaining_space') || 'Remaining Space',
                t('rooms.status.full') || 'Full',
                t('rooms.status.maintenance') || 'Maintenance',
              ],
              datasets: [{
                data: [
                  roomStatusDistribution.not_occupied, 
                  roomStatusDistribution.remaining_space, 
                  roomStatusDistribution.full, 
                  roomStatusDistribution.maintenance
                ],
                backgroundColor: [
                  theme.palette.grey[400],     // Not occupied - grey
                  theme.palette.info.main,     // Remaining space - blue/info
                  theme.palette.success.main,  // Full - green
                  theme.palette.warning.main,  // Maintenance - orange
                ],
                borderWidth: 0,
                hoverOffset: 10,
              }],
            },
            paymentStatusData: {
              labels: [
                t('dashboard.charts.paid') || 'Paid',
                t('dashboard.charts.pending') || 'Pending',
                t('dashboard.charts.failed') || 'Failed',
              ],
              datasets: [{
                data: [paymentStatusDistribution.paid, paymentStatusDistribution.pending, paymentStatusDistribution.failed],
                backgroundColor: [
                  theme.palette.success.main,
                  theme.palette.warning.main,
                  theme.palette.error.main,
                ],
                borderWidth: 0,
                hoverOffset: 10,
              }],
            },
          });

        } catch (chartError) {
          console.error('Error loading chart data:', chartError);
        } finally {
          setChartsLoading(false);
        }
      }, 100); // Small delay to allow stats to render first

      // Prepare recent activities
      const activities = [];
      
      recentPaymentsResponse.documents.slice(0, 2).forEach(payment => {
        activities.push({
          id: `payment_${payment.$id}`,
          type: 'payment',
          title: t('dashboard.activity.paymentReceived') || 'Payment Received',
          description: t('dashboard.activity.paymentAmount', { 
            amount: payment.finalAmount || payment.amount 
          }) || `Payment of OMR ${payment.finalAmount || payment.amount} received`,
          time: formatTimeAgo(payment.createdAt),
          avatar: <PaymentIcon />,
          color: theme.palette.success.main,
          createdAt: payment.createdAt,
        });
      });
      
      recentContractsResponse.documents.slice(0, 2).forEach(contract => {
        activities.push({
          id: `contract_${contract.$id}`,
          type: 'contract',
          title: t('dashboard.activity.newContract') || 'New Contract',
          description: t('dashboard.activity.contractSigned', { 
            name: contract.studentName 
          }) || `${contract.studentName} signed a new contract`,
          time: formatTimeAgo(contract.createdAt),
          avatar: <DescriptionIcon />,
          color: theme.palette.primary.main,
          createdAt: contract.createdAt,
        });
      });
      
      recentFoodOrdersResponse.documents.slice(0, 1).forEach(order => {
        activities.push({
          id: `food_${order.$id}`,
          type: 'food',
          title: t('dashboard.activity.foodOrder') || 'Food Order',
          description: t('dashboard.activity.foodOrderAmount', { 
            amount: order.totalAmount 
          }) || `New food order for OMR ${order.totalAmount}`,
          time: formatTimeAgo(order.createdAt),
          avatar: <RestaurantIcon />,
          color: theme.palette.info.main,
          createdAt: order.createdAt,
        });
      });
      
      recentCheckoutResponse.documents.slice(0, 1).forEach(request => {
        activities.push({
          id: `checkout_${request.$id}`,
          type: 'checkout',
          title: t('dashboard.activity.checkoutRequest') || 'Checkout Request',
          description: t('dashboard.activity.checkoutSubmitted') || 'New checkout request submitted',
          time: formatTimeAgo(request.createdAt),
          avatar: <ExitToAppIcon />,
          color: theme.palette.warning.main,
          createdAt: request.createdAt,
        });
      });

      activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentActivities(activities);
        
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(t('dashboard.error.loadFailed') || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [databases, databaseId, collections, timeRange, theme.palette, t]);
  
  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('dashboard.time.justNow') || 'Just now';
    if (diffInMinutes < 60) return t('dashboard.time.minutesAgo', { count: diffInMinutes }) || `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      const key = diffInHours === 1 ? 'dashboard.time.hoursAgo' : 'dashboard.time.hoursAgoPlural';
      return t(key, { count: diffInHours }) || `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      const key = diffInDays === 1 ? 'dashboard.time.daysAgo' : 'dashboard.time.daysAgoPlural';
      return t(key, { count: diffInDays }) || `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  // Enhanced chart options with theme awareness
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            weight: '500',
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: alpha(theme.palette.divider, 0.1),
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: alpha(theme.palette.divider, 0.1),
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
          },
        },
        border: {
          color: alpha(theme.palette.divider, 0.1),
        },
      },
      y: {
        grid: {
          color: alpha(theme.palette.divider, 0.1),
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
          },
        },
        border: {
          color: alpha(theme.palette.divider, 0.1),
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      bar: {
        borderRadius: 4,
      },
    },
  }), [theme.palette]);
  
  // Enhanced pie chart options
  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12,
            weight: '500',
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: alpha(theme.palette.divider, 0.1),
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff',
      },
    },
  }), [theme.palette]);

  // Handle range change with loading state
  const handleRangeChange = (event) => {
    setTimeRange(event.target.value);
    setChartsLoading(true);
  };

  // Enhanced refresh function
  const handleRefresh = () => {
    fetchDashboardData();
  };
  
  if (error) {
    return (
      <Fade in={true}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <PageHeader title={t('dashboard.title') || 'Dashboard'} />
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }
            }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRefresh}
              >
                <RefreshIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Container>
      </Fade>
    );
  }
  
  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Loading Progress Bar */}
        {loading && (
          <LinearProgress 
            sx={{ 
              mb: 2,
              borderRadius: 1,
              height: 4,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }} 
          />
        )}

        {/* Enhanced Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
            }}>
              <AssessmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}>
                {t('dashboard.title') || 'Dashboard'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time insights and analytics
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            {/* Time Range Filter */}
            <FormControl 
              sx={{ minWidth: 160 }} 
              size="small"
              disabled={loading}
            >
              <InputLabel sx={{ color: theme.palette.text.secondary }}>
                {t('dashboard.filter.timeRange') || 'Time Range'}
              </InputLabel>
              <Select
                value={timeRange}
                label={t('dashboard.filter.timeRange') || 'Time Range'}
                onChange={handleRangeChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <MenuItem value="week">{t('dashboard.filter.weekly') || 'Weekly'}</MenuItem>
                <MenuItem value="month">{t('dashboard.filter.monthly') || 'Monthly'}</MenuItem>
                <MenuItem value="quarter">{t('dashboard.filter.quarterly') || 'Quarterly'}</MenuItem>
                <MenuItem value="year">{t('dashboard.filter.yearly') || 'Yearly'}</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                borderRadius: 2,
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                      <Skeleton variant="text" sx={{ mt: 2 }} />
                      <Skeleton variant="text" width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <>
            {/* Enhanced KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {statsCards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={card.title}>
                  <Zoom in={true} timeout={card.delay}>
                    <Card 
                      sx={{
                        background: card.gradient,
                        color: 'white',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer',
                        transform: 'translateY(0)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: 3,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '& .stat-icon': {
                            transform: 'scale(1.1) rotate(5deg)',
                          }
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                          pointerEvents: 'none',
                        }
                      }}
                    >
                      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h3" fontWeight="bold" sx={{ 
                              mb: 1,
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              background: `linear-gradient(45deg, #fff, ${alpha('#fff', 0.8)})`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontSize: { xs: '1.8rem', md: '2.2rem' }
                            }}>
                              {card.value}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              opacity: 0.9,
                              fontWeight: 500,
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                              mb: card.subtitle ? 0.5 : 1,
                            }}>
                              {card.title}
                            </Typography>
                            {card.subtitle && (
                              <Typography variant="caption" sx={{ 
                                opacity: 0.7,
                                fontSize: '0.75rem',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                              }}>
                                {card.subtitle}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{
                            p: 2,
                            borderRadius: '50%',
                            background: alpha('#fff', 0.2),
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha('#fff', 0.3)}`,
                            transition: 'all 0.3s ease',
                          }} className="stat-icon">
                            <card.icon sx={{ fontSize: 32, color: '#fff' }} />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </>
        )}
          
        {/* Enhanced Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Occupancy Trend */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1400}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: 400,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                    : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? `0 8px 32px ${alpha('#000', 0.3)}`
                    : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {t('dashboard.charts.occupancyTrend') || 'Occupancy Trend'}
                  </Typography>
                  <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Box sx={{ height: 300, position: 'relative' }}>
                  {chartsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : chartData.occupancyTrend ? (
                    <Line data={chartData.occupancyTrend} options={chartOptions} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          </Grid>
          
          {/* Monthly Revenue */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1600}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: 400,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                    : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? `0 8px 32px ${alpha('#000', 0.3)}`
                    : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {t('dashboard.charts.monthlyRevenue') || 'Revenue Over Time'}
                  </Typography>
                  <MonetizationOnIcon sx={{ color: theme.palette.secondary.main }} />
                </Box>
                <Box sx={{ height: 300, position: 'relative' }}>
                  {chartsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : chartData.revenueData ? (
                    <Bar data={chartData.revenueData} options={chartOptions} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          </Grid>
          
          {/* Room Status Distribution */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1800}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: 400,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                    : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? `0 8px 32px ${alpha('#000', 0.3)}`
                    : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {t('dashboard.charts.roomStatus') || 'Room Status Distribution'}
                  </Typography>
                  <HomeIcon sx={{ color: theme.palette.info.main }} />
                </Box>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  {chartsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : chartData.roomStatusData ? (
                    <Box sx={{ width: '80%', height: '100%' }}>
                      <Doughnut data={chartData.roomStatusData} options={pieOptions} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          </Grid>
          
          {/* Payment Status Distribution */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={2000}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: 400,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                    : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? `0 8px 32px ${alpha('#000', 0.3)}`
                    : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {t('dashboard.charts.paymentStatus') || 'Payment Status Distribution'}
                  </Typography>
                  <PaymentIcon sx={{ color: theme.palette.warning.main }} />
                </Box>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  {chartsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : chartData.paymentStatusData ? (
                    <Box sx={{ width: '80%', height: '100%' }}>
                      <Pie data={chartData.paymentStatusData} options={pieOptions} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
        
        {/* Enhanced Recent Activity Feed */}
        <Fade in={true} timeout={2200}>
          <Card 
            elevation={0}
            sx={{
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? `0 8px 32px ${alpha('#000', 0.3)}`
                : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ScheduleIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    {t('dashboard.recentActivity') || 'Recent Activity'}
                  </Typography>
                </Box>
              }
              action={
                <IconButton 
                  aria-label="settings"
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{
                background: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            />
            <CardContent sx={{ p: 0 }}>
              {recentActivities.length > 0 ? (
                <List sx={{ py: 0 }}>
                  {recentActivities.map((activity, index) => (
                    <ListItem 
                      key={activity.id} 
                      alignItems="flex-start"
                      sx={{
                        borderBottom: index < recentActivities.length - 1 
                          ? `1px solid ${alpha(theme.palette.divider, 0.1)}` 
                          : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.02),
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: activity.color,
                            width: 48,
                            height: 48,
                            boxShadow: `0 4px 12px ${alpha(activity.color, 0.3)}`,
                          }}
                        >
                          {activity.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {activity.description}
                            </Typography>
                            <Chip
                              label={activity.time}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                borderColor: alpha(theme.palette.text.secondary, 0.3),
                                color: theme.palette.text.secondary,
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <ScheduleIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: theme.palette.text.disabled,
                      mb: 2,
                    }} 
                  />
                  <Typography variant="body1" color="text.secondary" fontWeight="medium">
                    {t('dashboard.noRecentActivity') || 'No recent activities'}
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Recent system activities will appear here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Fade>
  );
};

export default Dashboard; 