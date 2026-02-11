import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  CardHeader,
  InputAdornment,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ContactPhone as ContactPhoneIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { Query } from "appwrite";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotification } from "../contexts/NotificationContext";
import { useAppWrite } from "../contexts/AppWriteContext";

const StudentManagement = () => {
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const { databases, databaseId, collections, account, functions } =
    useAppWrite();
  const theme = useTheme();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "student",
    status: "active",
    emergencyContactName: "",
    emergencyContactPhone: "",
    idNumber: "",
    parentEmail: "",
    password: "Rafah@12345",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [formErrors, setFormErrors] = useState({});

  // Load students - fetches all students using pagination
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);

      // Check if user is authenticated first
      const currentUser = await account.get().catch(() => null);
      if (!currentUser) {
        showNotification("Please log in to access student data", "error");
        return;
      }

      // Fetch all students by paginating through results
      // Appwrite has a maximum limit per request (usually 100), so we need to paginate
      const allStudents = [];
      let offset = 0;
      const limit = 100; // Maximum allowed per request
      let hasMore = true;

      while (hasMore) {
        // Build queries array with filter and ordering
        // Note: Appwrite SDK v10+ uses queries array for all parameters
        const queries = [
          Query.equal("role", "student"), // Filter for students on server side
          Query.orderDesc("$createdAt"), // Order by creation date, most recent first
          Query.limit(limit), // Explicitly set limit to 100
          Query.offset(offset), // Set offset for pagination
        ];

        const response = await databases.listDocuments(
          databaseId,
          collections.users,
          queries
        );

        console.log(`Fetched ${response.documents.length} students (offset: ${offset}, total so far: ${allStudents.length + response.documents.length})`);

        allStudents.push(...response.documents);

        // Check if there are more documents to fetch
        if (response.documents.length < limit) {
          hasMore = false; // No more documents to fetch
        } else {
          offset += limit; // Move to next batch
        }
      }

      setStudents(allStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      showNotification(`Failed to load students: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [databases, databaseId, collections.users, showNotification, account]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = t("validation.required");
    }

    if (!formData.email.trim()) {
      errors.email = t("validation.required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t("validation.invalidEmail");
    }

    if (!formData.phone.trim()) {
      errors.phone = t("validation.required");
    } else {
      // Validate phone format: must start with '+' and have max 15 digits total
      const phone = formData.phone.trim();
      if (!phone.startsWith("+")) {
        errors.phone = "Phone number must start with '+'";
      } else if (phone.length > 15) {
        errors.phone = "Phone number can have a maximum of fifteen digits (including '+')";
      } else if (!/^\+[0-9]{1,14}$/.test(phone)) {
        errors.phone = "Phone number must start with '+' followed by digits only";
      }
    }

    if (!formData.idNumber.trim()) {
      errors.idNumber = t("validation.required");
    }

    if (!formData.emergencyContactName.trim()) {
      errors.emergencyContactName = t("validation.required");
    }

    if (!formData.emergencyContactPhone.trim()) {
      errors.emergencyContactPhone = t("validation.required");
    } else {
      // Validate emergency contact phone format: must start with '+' and have max 15 digits total
      const emergencyPhone = formData.emergencyContactPhone.trim();
      if (!emergencyPhone.startsWith("+")) {
        errors.emergencyContactPhone = "Phone number must start with '+'";
      } else if (emergencyPhone.length > 15) {
        errors.emergencyContactPhone = "Phone number can have a maximum of fifteen digits (including '+')";
      } else if (!/^\+[0-9]{1,14}$/.test(emergencyPhone)) {
        errors.emergencyContactPhone = "Phone number must start with '+' followed by digits only";
      }
    }

    // Validate parentEmail format if provided (optional field)
    if (formData.parentEmail.trim() && !/\S+@\S+\.\S+/.test(formData.parentEmail)) {
      errors.parentEmail = t("validation.invalidEmail");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/update student
  const handleSaveStudent = async () => {
    if (!validateForm()) {
      return;
    }
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const apikey = import.meta.env.VITE_APPWRITE_API_KEY;
    try {
      const now = new Date().toISOString();
      const studentData = {
        ...formData,
        role: "student", // Ensure role is always student
        updatedAt: now,
      };

      if (editingStudent) {
        const response = await functions.createExecution(
          "686821900038405415f7", // Replace with your actual update function ID
          JSON.stringify({
            body: JSON.stringify({
              userId: editingStudent.$id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              idNumber: formData.idNumber,
              emergencyContactPhone: formData.emergencyContactPhone,
              emergencyContactName: formData.emergencyContactName,
              parentEmail: formData.parentEmail,
              databaseId: databaseId, // Your database ID
              collectionId: collections.users, // Your users collection ID
            }),
          })
        );

        // Parse the function response
        const result = JSON.parse(response.responseBody);

        if (result.success) {
          showNotification(t("systemUsers.userUpdated"), "success");
          handleCloseDialog();
          loadStudents();
        } else {
          throw new Error(result.message);
        }
      } else {
        const functionPayload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
        };

        const res = await fetch(
          "https://appwrite.rafah-housing.com/v1/functions/6864eac70004e2c4c75d/executions",
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
                password: "Rafah@12345",
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

        const newUserId = functionResponse.userId;
        studentData.createdAt = now;
        await databases.createDocument(
          databaseId,
          collections.users,
          newUserId,
          studentData
        );
        await account.createRecovery(
          formData.email,
          "https://manager.rafah-housing.com/reset-password"
        );

        showNotification(t("students.createSuccess"), "success");
      }

      handleCloseDialog();
      loadStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      showNotification(t("errors.saveStudent"), "error");
    }
  };

  // Handle delete student
  const handleDeleteStudent = async () => {
    try {
      // Call the delete user function
      const response = await functions.createExecution(
        "686805d90004bf9c4ec1", // Replace with your actual function ID
        JSON.stringify({
          body: JSON.stringify({
            userId: studentToDelete.$id,
            databaseId: databaseId,
            collectionId: collections.users,
          }),
        })
      );

      // Parse the function response
      const result = JSON.parse(response.responseBody);

      if (result.success) {
        showNotification(t("students.deleteSuccess"), "success");
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
        loadStudents();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      showNotification(t("errors.deleteStudent"), "error");
    }
  };

  // Open dialog for new student
  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "student",
      status: "active",
      emergencyContactName: "",
      emergencyContactPhone: "",
      idNumber: "",
      parentEmail: "",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open dialog for editing student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      role: student.role || "student",
      status: student.status || "active",
      emergencyContactName: student.emergencyContactName || "",
      emergencyContactPhone: student.emergencyContactPhone || "",
      idNumber: student.idNumber || "",
      parentEmail: student.parentEmail || "",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStudent(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "student",
      status: "active",
      emergencyContactName: "",
      emergencyContactPhone: "",
      idNumber: "",
      parentEmail: "",
    });
    setFormErrors({});
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm) ||
      student.idNumber?.includes(searchTerm)
  );

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  // Get status translation with fallback
  const getStatusTranslation = (status) => {
    if (!status) {
      return t("students.status.active");
    }

    // Normalize status to lowercase to handle case issues
    const normalizedStatus = status.toString().toLowerCase().trim();
    const validStatuses = ["active", "suspended"];
    const finalStatus = validStatuses.includes(normalizedStatus)
      ? normalizedStatus
      : "active";

    return t(`students.status.${finalStatus}`);
  };

  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Loading Progress Bar */}
        {loading && (
          <LinearProgress
            sx={{
              mb: 2,
              borderRadius: 1,
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          />
        )}

        {/* Enhanced Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 56,
                height: 56,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              <SchoolIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("students.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage student information and records
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudents}
              sx={{
                borderRadius: 2,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.primary.main,
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.05),
                  transform: "translateY(-2px)",
                },
              }}
            >
              {t("common.refresh")}
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddStudent}
              sx={{
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 15px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 25px ${alpha(
                    theme.palette.primary.main,
                    0.4
                  )}`,
                },
              }}
            >
              {t("students.addStudent")}
            </Button>
          </Stack>
        </Box>

        {/* Enhanced Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: "Total Students",
              value: students.length,
              icon: GroupIcon,
              gradient: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.8
              )}, ${alpha(theme.palette.primary.dark, 0.9)})`,
              delay: 100,
            },
            {
              title: "Active Students",
              value: students.filter((s) => s.status === "active").length,
              icon: PersonIcon,
              gradient: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.8
              )}, ${alpha(theme.palette.success.dark, 0.9)})`,
              delay: 200,
            },
            {
              title: "Suspended Students",
              value: students.filter((s) => s.status === "suspended").length,
              icon: AssignmentIcon,
              gradient: `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.8
              )}, ${alpha(theme.palette.warning.dark, 0.9)})`,
              delay: 300,
            },
            {
              title: "Registration Rate",
              value:
                students.length > 0
                  ? `${Math.round(
                      (students.filter((s) => s.status === "active").length /
                        students.length) *
                        100
                    )}%`
                  : "0%",
              icon: TrendingUpIcon,
              gradient: `linear-gradient(135deg, ${alpha(
                theme.palette.info.main,
                0.8
              )}, ${alpha(theme.palette.info.dark, 0.9)})`,
              delay: 400,
            },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Zoom in={true} timeout={stat.delay}>
                <Card
                  sx={{
                    background: stat.gradient,
                    color: "white",
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    transform: "translateY(0)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: `0 20px 40px ${alpha(
                        theme.palette.primary.main,
                        0.3
                      )}`,
                      "& .stat-icon": {
                        transform: "scale(1.1) rotate(5deg)",
                      },
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(45deg, ${alpha(
                        "#fff",
                        0.1
                      )}, transparent)`,
                      pointerEvents: "none",
                    },
                  }}
                >
                  <CardContent sx={{ position: "relative", zIndex: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography
                          variant="h3"
                          fontWeight="bold"
                          sx={{
                            mb: 1,
                            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                            background: `linear-gradient(45deg, #fff, ${alpha(
                              "#fff",
                              0.8
                            )})`,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            opacity: 0.9,
                            fontWeight: 500,
                            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                          }}
                        >
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "50%",
                          background: alpha("#fff", 0.2),
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${alpha("#fff", 0.3)}`,
                          transition: "all 0.3s ease",
                        }}
                        className="stat-icon"
                      >
                        <stat.icon sx={{ fontSize: 32, color: "#fff" }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Enhanced Search Section */}
        <Fade in={true} timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background:
                theme.palette.mode === "dark"
                  ? `linear-gradient(145deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )}, ${alpha(theme.palette.background.paper, 0.4)})`
                  : `linear-gradient(145deg, ${alpha("#fff", 0.9)}, ${alpha(
                      "#fff",
                      0.6
                    )})`,
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 8px 32px ${alpha("#000", 0.3)}`
                  : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              }}
            >
              <SearchIcon
                sx={{ color: theme.palette.primary.main, fontSize: 24 }}
              />
              <TextField
                fullWidth
                variant="outlined"
                placeholder={t("students.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    background: alpha(theme.palette.background.paper, 0.8),
                    "&:hover": {
                      boxShadow: `0 4px 12px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}`,
                    },
                    "&.Mui-focused": {
                      boxShadow: `0 4px 20px ${alpha(
                        theme.palette.primary.main,
                        0.25
                      )}`,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Students DataGrid */}
        <Fade in={true} timeout={1400}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              background:
                theme.palette.mode === "dark"
                  ? `linear-gradient(145deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )}, ${alpha(theme.palette.background.paper, 0.4)})`
                  : `linear-gradient(145deg, ${alpha("#fff", 0.9)}, ${alpha(
                      "#fff",
                      0.6
                    )})`,
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 8px 32px ${alpha("#000", 0.3)}`
                  : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: 600,
                width: "100%",
                "& .MuiDataGrid-root": {
                  borderRadius: 0,
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    background: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `2px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                    "& .MuiDataGrid-columnHeader": {
                      fontWeight: "bold",
                    },
                  },
                  "& .MuiDataGrid-row": {
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: alpha(theme.palette.primary.main, 0.02),
                      transform: "scale(1.001)",
                    },
                  },
                },
              }}
            >
              <DataGrid
                rows={filteredStudents}
                columns={[
                  {
                    field: "name",
                    headerName: t("students.name"),
                    flex: 1.2,
                    minWidth: 150,
                    renderCell: (params) => (
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            width: 40,
                            height: 40,
                            fontSize: "1rem",
                          }}
                        >
                          {(params.value || "U").charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {params.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Student
                          </Typography>
                        </Box>
                      </Stack>
                    ),
                  },
                  {
                    field: "email",
                    headerName: t("students.email"),
                    flex: 1.5,
                    minWidth: 200,
                    renderCell: (params) => (
                      <Box>
                        <Typography variant="body2">{params.value}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Email Address
                        </Typography>
                      </Box>
                    ),
                  },
                  {
                    field: "phone",
                    headerName: t("students.phone"),
                    flex: 1,
                    minWidth: 130,
                    renderCell: (params) => (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ContactPhoneIcon
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: 16,
                          }}
                        />
                        <Typography variant="body2">{params.value}</Typography>
                      </Stack>
                    ),
                  },
                  {
                    field: "idNumber",
                    headerName: t("students.idNumber"),
                    flex: 1,
                    minWidth: 120,
                    renderCell: (params) => (
                      <Chip
                        label={params.value}
                        size="small"
                        sx={{
                          background: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                          fontWeight: "bold",
                          borderRadius: 2,
                          fontFamily: "monospace",
                        }}
                      />
                    ),
                  },
                  {
                    field: "status",
                    headerName: t("students.statusLabel"),
                    flex: 0.8,
                    minWidth: 100,
                    renderCell: (params) => (
                      <Chip
                        label={getStatusTranslation(params.value)}
                        color={getStatusColor(params.value)}
                        size="small"
                        sx={{
                          fontWeight: "medium",
                          borderRadius: 2,
                        }}
                      />
                    ),
                  },
                  {
                    field: "emergencyContact",
                    headerName: t("students.emergencyContact"),
                    flex: 1.3,
                    minWidth: 180,
                    renderCell: (params) => (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {params.row.emergencyContactName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {params.row.emergencyContactPhone}
                        </Typography>
                      </Box>
                    ),
                  },
                  {
                    field: "createdAt",
                    headerName: t("common.createdAt"),
                    flex: 1,
                    minWidth: 120,
                    renderCell: (params) => (
                      <Typography variant="caption" color="text.secondary">
                        {params.value
                          ? new Date(params.value).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    ),
                  },
                  {
                    field: "actions",
                    headerName: t("common.actions"),
                    flex: 1,
                    minWidth: 120,
                    sortable: false,
                    renderCell: (params) => (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={t("common.edit")}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditStudent(params.row)}
                            sx={{
                              background: alpha(
                                theme.palette.warning.main,
                                0.1
                              ),
                              color: theme.palette.warning.main,
                              "&:hover": {
                                background: alpha(
                                  theme.palette.warning.main,
                                  0.2
                                ),
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("common.delete")}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setStudentToDelete(params.row);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{
                              background: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              "&:hover": {
                                background: alpha(
                                  theme.palette.error.main,
                                  0.2
                                ),
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ),
                  },
                ]}
                getRowId={(row) => row.$id}
                paginationModel={{ page, pageSize: rowsPerPage }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setRowsPerPage(model.pageSize);
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                loading={loading}
                disableSelectionOnClick
                localeText={{
                  noRowsLabel: t("students.noStudents"),
                }}
              />
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Add/Edit Student Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              background:
                theme.palette.mode === "dark"
                  ? `linear-gradient(145deg, ${alpha(
                      theme.palette.background.paper,
                      0.9
                    )}, ${alpha(theme.palette.background.paper, 0.7)})`
                  : `linear-gradient(145deg, ${alpha("#fff", 0.95)}, ${alpha(
                      "#fff",
                      0.8
                    )})`,
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: "white",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha("#fff", 0.2) }}>
                {editingStudent ? <EditIcon /> : <PersonAddIcon />}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {editingStudent
                    ? t("students.editStudent")
                    : t("students.addStudent")}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {editingStudent
                    ? "Update student information"
                    : "Add new student to the system"}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha("#fff", 0.9),
              backdropFilter: "blur(10px)",
            }}
          >
            <Card
              elevation={0}
              sx={{
                mt: 2,
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t("students.name")}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      error={!!formErrors.name}
                      helperText={formErrors.name}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t("students.email")}
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      error={!!formErrors.email}
                      helperText={formErrors.email}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t("students.parentEmail")}
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) =>
                        handleInputChange("parentEmail", e.target.value)
                      }
                      error={!!formErrors.parentEmail}
                      helperText={formErrors.parentEmail}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t("students.phone")}
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      error={!!formErrors.phone}
                      helperText={formErrors.phone}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ContactPhoneIcon
                              sx={{ color: theme.palette.text.secondary }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t("students.idNumber")}
                      value={formData.idNumber}
                      onChange={(e) =>
                        handleInputChange("idNumber", e.target.value)
                      }
                      error={!!formErrors.idNumber}
                      helperText={formErrors.idNumber}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AssignmentIcon
                              sx={{ color: theme.palette.text.secondary }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    >
                      <InputLabel>{t("students.status.label")}</InputLabel>
                      <Select
                        value={formData.status}
                        label={t("students.status.label")}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                      >
                        <MenuItem value="active">
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Chip
                              label={t("students.status.active")}
                              color="success"
                              size="small"
                            />
                          </Stack>
                        </MenuItem>
                        <MenuItem value="suspended">
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Chip
                              label={t("students.status.suspended")}
                              color="error"
                              size="small"
                            />
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t("students.emergencyContactName")}
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactName",
                          e.target.value
                        )
                      }
                      error={!!formErrors.emergencyContactName}
                      helperText={formErrors.emergencyContactName}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t("students.emergencyContactPhone")}
                      value={formData.emergencyContactPhone}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactPhone",
                          e.target.value
                        )
                      }
                      error={!!formErrors.emergencyContactPhone}
                      helperText={formErrors.emergencyContactPhone}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ContactPhoneIcon
                              sx={{ color: theme.palette.text.secondary }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: `0 4px 12px ${alpha(
                              theme.palette.primary.main,
                              0.15
                            )}`,
                          },
                          "&.Mui-focused": {
                            boxShadow: `0 4px 20px ${alpha(
                              theme.palette.primary.main,
                              0.25
                            )}`,
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.8),
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              onClick={handleCloseDialog}
              sx={{
                borderRadius: 2,
                px: 3,
                color: theme.palette.text.secondary,
                "&:hover": {
                  background: alpha(theme.palette.text.secondary, 0.1),
                },
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveStudent}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 15px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 25px ${alpha(
                    theme.palette.primary.main,
                    0.4
                  )}`,
                },
              }}
            >
              {editingStudent ? t("common.update") : t("common.create")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enhanced Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              background:
                theme.palette.mode === "dark"
                  ? `linear-gradient(145deg, ${alpha(
                      theme.palette.background.paper,
                      0.9
                    )}, ${alpha(theme.palette.background.paper, 0.7)})`
                  : `linear-gradient(145deg, ${alpha("#fff", 0.95)}, ${alpha(
                      "#fff",
                      0.8
                    )})`,
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              color: "white",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha("#fff", 0.2) }}>
                <DeleteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {t("students.deleteConfirmTitle")}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  This action cannot be undone
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha("#fff", 0.9),
              backdropFilter: "blur(10px)",
              p: 3,
            }}
          >
            <Alert
              severity="warning"
              sx={{
                borderRadius: 2,
                mb: 2,
                background: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <Typography>
                {t("students.deleteConfirmMessage", {
                  name: studentToDelete?.name,
                })}
              </Typography>
            </Alert>
            {studentToDelete && (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {(studentToDelete.name || "U").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {studentToDelete.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {studentToDelete.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {studentToDelete.idNumber}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.8),
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                borderRadius: 2,
                px: 3,
                color: theme.palette.text.secondary,
                "&:hover": {
                  background: alpha(theme.palette.text.secondary, 0.1),
                },
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDeleteStudent}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                boxShadow: `0 4px 15px ${alpha(theme.palette.error.main, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 25px ${alpha(
                    theme.palette.error.main,
                    0.4
                  )}`,
                },
              }}
            >
              {t("common.delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Fade>
  );
};

export default StudentManagement;
