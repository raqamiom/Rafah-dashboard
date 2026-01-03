import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  FormHelperText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  Restaurant as RestaurantIcon,
  Build as ServiceIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useAppWrite } from "../contexts/AppWriteContext";
import { useNotification } from "../contexts/NotificationContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import PageHeader from "../components/common/PageHeader";
import { Query } from "appwrite";

// User role options for non-students
const USER_ROLES = ["admin", "service", "restaurant"];

// Role configurations
const ROLE_CONFIG = {
  admin: {
    label: "System Administrator",
    color: "error",
    icon: AdminIcon,
    description: "Full system access and management capabilities",
  },
  service: {
    label: "Service Staff",
    color: "info",
    icon: ServiceIcon,
    description: "Can manage service orders and maintenance requests",
  },
  restaurant: {
    label: "Restaurant Staff",
    color: "warning",
    icon: RestaurantIcon,
    description: "Can manage food orders and menu items",
  },
};

const SystemUsers = () => {
  const { account, databases, databaseId, collections, ID, functions, client } =
    useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const { user: currentUser } = useAuth();
  const theme = useTheme();

  // State for user data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // 'create', 'edit', 'delete', 'view'

  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "service",
    password: "Rafah@12345",
    confirmPassword: "Rafah@12345",
    isActive: true,
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // State for role analytics
  const [roleStats, setRoleStats] = useState({});
  const [allUserRoles, setAllUserRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch all user roles from users collection
  const fetchUserRoles = async () => {
    try {
      setLoadingRoles(true);

      // Fetch all users (including students) to get complete role picture
      const allUsersResponse = await databases.listDocuments(
        databaseId,
        collections.users,
        [
          Query.notEqual("isDeleted", true), // Only active users
          Query.select(["role", "isActive", "createdAt"]),
        ],
        1000 // High limit to get all users
      );

      // Extract unique roles
      const rolesSet = new Set();
      const roleAnalytics = {};

      allUsersResponse.documents.forEach((user) => {
        if (user.role) {
          rolesSet.add(user.role);

          // Count users by role
          if (!roleAnalytics[user.role]) {
            roleAnalytics[user.role] = {
              total: 0,
              active: 0,
              inactive: 0,
            };
          }

          roleAnalytics[user.role].total++;
          if (user.isActive !== false) {
            roleAnalytics[user.role].active++;
          } else {
            roleAnalytics[user.role].inactive++;
          }
        }
      });

      setAllUserRoles(Array.from(rolesSet));
      setRoleStats(roleAnalytics);

      console.log("User roles found:", Array.from(rolesSet));
      console.log("Role analytics:", roleAnalytics);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      showError("Failed to fetch user roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch system users (non-students)
  const fetchSystemUsers = async () => {
    try {
      setLoading(true);

      // Prepare filters
      const filters = [];

      // Filter out soft deleted users and students
      filters.push(Query.notEqual("isDeleted", true));
      filters.push(Query.notEqual("role", "student"));

      if (filterRole !== "all") {
        filters.push(Query.equal("role", filterRole));
      }

      if (filterStatus !== "all") {
        const isActive = filterStatus === "active";
        filters.push(Query.equal("isActive", isActive));
      }

      if (searchQuery) {
        filters.push(Query.search("name", searchQuery));
      }

      // Fetch users
      const response = await databases.listDocuments(
        databaseId,
        collections.users,
        filters,
        100, // Limit
        paginationModel.page * paginationModel.pageSize,
        "$createdAt",
        "DESC"
      );

      setUsers(response.documents);
      setTotalUsers(response.total);
    } catch (error) {
      console.error("Error fetching system users:", error);
      showError(t("systemUsers.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSystemUsers();
    fetchUserRoles(); // Fetch role analytics
  }, [paginationModel, searchQuery, filterRole, filterStatus]);

  // Validate form data
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = t("systemUsers.validation.nameRequired");
    }

    if (!formData.email.trim()) {
      errors.email = t("systemUsers.validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t("systemUsers.validation.emailInvalid");
    }

    if (!formData.phone.trim()) {
      errors.phone = t("systemUsers.validation.phoneRequired");
    }

    if (!formData.role) {
      errors.role = t("systemUsers.validation.roleRequired");
    }
    if (!formData.phone.startsWith("+")) {
      errors.phone = t("systemUsers.validation.invalidPhone");
    }

    if (dialogMode === "create") {
      if (!formData.password) {
        errors.password = t("systemUsers.validation.passwordRequired");
      } else if (formData.password.length < 8) {
        errors.password = t("systemUsers.validation.passwordLength");
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t("systemUsers.validation.passwordMismatch");
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear validation error
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  // Handle dialog open for create
  const handleCreateUser = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "service",
      password: "Rafah@12345",
      confirmPassword: "Rafah@12345",
      isActive: true,
    });
    setFormErrors({});
    setDialogMode("create");
    setOpenDialog(true);
  };

  // Handle dialog open for edit
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "service",

      isActive: user.isActive !== false,
    });
    setFormErrors({});
    setDialogMode("edit");
    setOpenDialog(true);
  };

  // Handle dialog open for view
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setDialogMode("view");
    setOpenDialog(true);
  };

  // Handle dialog open for delete
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDialogMode("delete");
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "service",
      password: "Rafah@12345",
      confirmPassword: "Rafah@12345",
      isActive: true,
    });
    setFormErrors({});
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };

      if (dialogMode === "create") {
        const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
        const apikey = import.meta.env.VITE_APPWRITE_API_KEY;

        try {
          // 🔁 Step 1: Call the function to create the Appwrite auth user
          const functionPayload = {
            email: formData.email,
            password: formData.password,
            name: formData.name,
          };

          const res = await fetch(
            "https://appwrite.rafah-housing.com//v1/functions/6864eac70004e2c4c75d/executions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Appwrite-Project": projectId,
                "X-Appwrite-Key": apikey,
              },
              body: JSON.stringify({
                body: JSON.stringify({
                  email: formData.email,
                  password: formData.password,
                  name: formData.name,
                }),
              }),
            }
          );

          const data = await res.json();

          if (!res.ok) {
            alert(
              `❌ Error: HTTP ${res.status} - ${
                data.message || "Function execution failed"
              }`
            );
            return;
          }

          // Check if function execution was successful
          if (data.status !== "completed") {
            alert(`❌ Error: Function execution status: ${data.status}`);
            return;
          }

          // Parse the function response
          let functionResponse;
          try {
            functionResponse = JSON.parse(data.responseBody);
          } catch (parseError) {
            alert("❌ Error: Invalid response format from function");
            return;
          }

          if (!functionResponse.success) {
            alert(`⚠️ Failed to create user:\n${functionResponse.message}`);
            return;
          }

          const newUserId = functionResponse.userId; // 👈 returned from the function

          // ✅ Step 2: Create the user document in the DB using the same ID
          const userData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || "",
            role: formData.role,
            isActive: formData.isActive,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentUser.$id,
          };

          await databases.createDocument(
            databaseId,
            collections.users,
            newUserId, // Use the same ID from auth user
            userData
          );

          showSuccess(t("systemUsers.userCreated"));
          await account.createRecovery(
            formData.email,
            "https://rafah-housing.com/resetlink.php"
          );
          handleCloseDialog();
          fetchSystemUsers();
        } catch (err) {
          console.error("Create user error:", err);
          alert(`❌ Error: ${err.message}`);
        }
      } else if (dialogMode === "edit") {
        try {
          if (dialogMode === "edit") {
            // Call the update user function
            const response = await functions.createExecution(
              "686821900038405415f7", // Replace with your actual update function ID
              JSON.stringify({
                body: JSON.stringify({
                  userId: selectedUser.$id,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  role: formData.role,
                  databaseId: databaseId, // Your database ID
                  collectionId: collections.users, // Your users collection ID
                  updatedBy: currentUser.$id, // Who is performing the update
                }),
              })
            );

            // Parse the function response
            const result = JSON.parse(response.responseBody);

            if (result.success) {
              showSuccess(t("systemUsers.userUpdated"));
              handleCloseDialog();
              fetchSystemUsers(); // Refresh the user list
            } else {
              throw new Error(result.message);
            }
          } else {
            // Your existing create logic here
            // ...
          }
        } catch (error) {
          console.error("Error updating user:", error);
          showError(t("systemUsers.updateError"));
        }
      }

      handleCloseDialog();
      fetchSystemUsers();
    } catch (error) {
      console.error(
        `Error ${dialogMode === "create" ? "creating" : "updating"} user:`,
        error
      );
      showError(
        dialogMode === "create"
          ? t("systemUsers.createError")
          : t("systemUsers.updateError")
      );
    }
  };

  // Handle user deletion (soft delete)
  const handleConfirmDelete = async () => {
    try {
      // Call the delete user function
      const response = await functions.createExecution(
        "686805d90004bf9c4ec1", // Replace with your actual function ID
        JSON.stringify({
          body: JSON.stringify({
            userId: selectedUser.$id,
            databaseId: databaseId, // Your database ID
            collectionId: collections.users, // Your users collection ID
            deletedBy: currentUser.$id, // Who is performing the deletion
          }),
        })
      );

      // Parse the function response
      const result = JSON.parse(response.responseBody);

      if (result.success) {
        showSuccess(t("systemUsers.userDeleted"));
        handleCloseDialog();
        fetchSystemUsers();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showError(t("systemUsers.deleteError"));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <PageHeader
        title={t("systemUsers.title")}
        actionLabel={t("systemUsers.create")}
        onAction={handleCreateUser}
      />

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const count = users.filter((user) => user.role === role).length;
          const IconComponent = config.icon;

          return (
            <Grid item xs={12} sm={6} md={4} key={role}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(135deg, ${
                    config.color === "error"
                      ? "#f44336"
                      : config.color === "info"
                      ? "#2196f3"
                      : "#ff9800"
                  } 20%, ${
                    config.color === "error"
                      ? "#d32f2f"
                      : config.color === "info"
                      ? "#1976d2"
                      : "#f57c00"
                  } 100%)`,
                  color: "white",
                  "&:hover": { transform: "translateY(-2px)" },
                  transition: "transform 0.2s",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {count}
                      </Typography>
                      <Typography variant="body1">
                        {t(`systemUsers.roles.${role}`)}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        width: 56,
                        height: 56,
                      }}
                    >
                      <IconComponent sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Role Analytics Section */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <AdminIcon />
            {t("systemUsers.roleAnalytics")}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchUserRoles}
            disabled={loadingRoles}
          >
            {loadingRoles ? (
              <CircularProgress size={16} />
            ) : (
              t("common.refresh")
            )}
          </Button>
        </Box>

        {loadingRoles ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {Object.entries(roleStats).map(([role, stats]) => (
              <Grid item xs={12} sm={6} md={4} key={role}>
                <Card
                  sx={{
                    height: "100%",
                    border: `1px solid ${theme.palette.divider}`,
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <CardContent sx={{ pb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {role === "student"
                          ? t("systemUsers.roles.student")
                          : role === "admin"
                          ? t("systemUsers.roles.admin")
                          : role === "service"
                          ? t("systemUsers.roles.service")
                          : role === "restaurant"
                          ? t("systemUsers.roles.restaurant")
                          : role}
                      </Typography>
                      {ROLE_CONFIG[role] &&
                        (() => {
                          const IconComponent = ROLE_CONFIG[role].icon;
                          return <IconComponent color="action" />;
                        })()}
                    </Box>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {stats.total}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Chip
                        label={`${stats.active} ${t("common.active")}`}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                      {stats.inactive > 0 && (
                        <Chip
                          label={`${stats.inactive} ${t("common.inactive")}`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* All Roles Summary */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{t("systemUsers.allRolesFound")}:</strong>{" "}
                  {allUserRoles.join(", ")}({allUserRoles.length}{" "}
                  {t("systemUsers.uniqueRoles")})
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {/* Search and filters */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
          }}
        >
          <TextField
            label={t("common.search")}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("systemUsers.role")}</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              label={t("systemUsers.role")}
            >
              <MenuItem value="all">
                {t("common.all")} {t("systemUsers.roles.admin")}
              </MenuItem>
              {USER_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {t(`systemUsers.roles.${role}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("common.status")}</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label={t("common.status")}
            >
              <MenuItem value="all">
                {t("common.all")} {t("common.status")}
              </MenuItem>
              <MenuItem value="active">{t("common.active")}</MenuItem>
              <MenuItem value="inactive">{t("common.inactive")}</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={t("common.refresh")}>
            <IconButton onClick={fetchSystemUsers}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            {t("systemUsers.create")}
          </Button>
        </Box>

        {/* Users data grid */}
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={users}
            columns={[
              {
                field: "name",
                headerName: t("systemUsers.name"),
                flex: 1,
                minWidth: 150,
                renderCell: (params) => (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {params.value?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">{params.value}</Typography>
                  </Box>
                ),
              },
              {
                field: "email",
                headerName: t("systemUsers.email"),
                flex: 1.2,
                minWidth: 200,
                renderCell: (params) => (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{params.value}</Typography>
                  </Box>
                ),
              },
              {
                field: "role",
                headerName: t("systemUsers.role"),
                flex: 0.8,
                minWidth: 130,
                renderCell: (params) => {
                  const config = ROLE_CONFIG[params.value] || {};
                  const IconComponent = config.icon || AdminIcon;
                  return (
                    <Chip
                      icon={<IconComponent fontSize="small" />}
                      label={
                        t(`systemUsers.roles.${params.value}`) || params.value
                      }
                      color={config.color || "default"}
                      size="small"
                      variant="outlined"
                    />
                  );
                },
              },

              {
                field: "phone",
                headerName: t("systemUsers.phone"),
                flex: 0.8,
                minWidth: 120,
                renderCell: (params) => (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {params.value || "-"}
                    </Typography>
                  </Box>
                ),
              },
              {
                field: "isActive",
                headerName: t("common.status"),
                flex: 0.6,
                minWidth: 100,
                renderCell: (params) => (
                  <Chip
                    label={
                      params.value !== false
                        ? t("common.active")
                        : t("common.inactive")
                    }
                    color={params.value !== false ? "success" : "error"}
                    size="small"
                  />
                ),
              },
              {
                field: "createdAt",
                headerName: t("common.createdAt"),
                flex: 0.8,
                minWidth: 120,
                valueFormatter: (params) => formatDate(params.value),
              },
              {
                field: "actions",
                headerName: t("common.actions"),
                flex: 0.8,
                minWidth: 120,
                sortable: false,
                renderCell: (params) => (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={t("common.view")}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewUser(params.row)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("common.edit")}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(params.row)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("common.delete")}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(params.row)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ),
              },
            ]}
            getRowId={(row) => row.$id}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={totalUsers}
            paginationMode="server"
            loading={loading}
            disableSelectionOnClick
            localeText={{
              noRowsLabel: "No system users found",
            }}
          />
        </Box>
      </Paper>

      {/* Dialog for CRUD operations */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {dialogMode === "delete" ? (
          <>
            <DialogTitle color="error">
              {t("systemUsers.delete")} - {selectedUser?.name}
            </DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t("systemUsers.deleteConfirm")}
              </Alert>
              <Typography>{t("systemUsers.deleteWarning")}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>{t("common.cancel")}</Button>
              <Button
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
              >
                {t("common.delete")}
              </Button>
            </DialogActions>
          </>
        ) : dialogMode === "view" ? (
          <>
            <DialogTitle>
              {t("systemUsers.view")} - {selectedUser?.name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("systemUsers.name")}
                  </Typography>
                  <Typography variant="body1">{selectedUser?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("systemUsers.email")}
                  </Typography>
                  <Typography variant="body1">{selectedUser?.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("systemUsers.phone")}
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser?.phone || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("systemUsers.role")}
                  </Typography>
                  {(() => {
                    const IconComponent = ROLE_CONFIG[selectedUser?.role]?.icon;
                    return (
                      <Chip
                        icon={
                          IconComponent ? (
                            <IconComponent fontSize="small" />
                          ) : null
                        }
                        label={
                          t(`systemUsers.roles.${selectedUser?.role}`) ||
                          selectedUser?.role
                        }
                        color={
                          ROLE_CONFIG[selectedUser?.role]?.color || "default"
                        }
                        size="small"
                      />
                    );
                  })()}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("common.status")}
                  </Typography>
                  <Chip
                    label={
                      selectedUser?.isActive !== false
                        ? t("common.active")
                        : t("common.inactive")
                    }
                    color={
                      selectedUser?.isActive !== false ? "success" : "error"
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("common.createdAt")}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedUser?.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>{t("common.close")}</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>
              {dialogMode === "create"
                ? t("systemUsers.create")
                : t("systemUsers.edit")}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`${t("systemUsers.name")} *`}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`${t("systemUsers.email")} *`}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`${t("systemUsers.phone")} *`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.role}>
                    <InputLabel>{t("systemUsers.role")} *</InputLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      label={`${t("systemUsers.role")} *`}
                    >
                      {USER_ROLES.map((role) => {
                        const IconComponent = ROLE_CONFIG[role].icon;
                        return (
                          <MenuItem key={role} value={role}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <IconComponent fontSize="small" />
                              {t(`systemUsers.roles.${role}`)}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {formErrors.role && (
                      <FormHelperText>{formErrors.role}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {dialogMode === "create" && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={`${t("systemUsers.password")} *`}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password} // Use formData instead of hardcoded value
                        onChange={handleInputChange}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={`${t("systemUsers.confirmPassword")} *`}
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword} // Use formData instead of hardcoded value
                        onChange={handleInputChange}
                        error={!!formErrors.confirmPassword}
                        helperText={formErrors.confirmPassword}
                      />
                    </Grid>
                  </>
                )}
                {dialogMode === "edit" && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2, display: "none" }}>
                      {t("systemUsers.passwordOptional")}
                    </Alert>
                    <TextField
                      fullWidth
                      sx={{ display: "none" }}
                      label={t("systemUsers.password")}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        name="isActive"
                      />
                    }
                    label={t("systemUsers.isActive")}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} variant="contained">
                {dialogMode === "create"
                  ? t("common.create")
                  : t("common.update")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default SystemUsers;
