// src/pages/admin/components/ParametersPage.tsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { useAuthStore } from "../../../store/authStore";
import { showToast } from "../../../components/ui/Toast";
import {
  Users,
  Settings,
  Shield,
  UserCheck,
  AlertTriangle,
  Search,
  ChevronDown,
} from "lucide-react";
import type { User } from "../../../types";

const ParametersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Fetch all users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const usersData: User[] = [];
        snapshot.forEach((doc) => {
          const userData = doc.data() as User;
          usersData.push({ ...userData, id: doc.id });
        });

        // Sort users: admins first, then by creation date
        usersData.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (a.role !== "admin" && b.role === "admin") return 1;

          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        showToast("მომხმარებლების ჩატვირთვა ვერ მოხერხდა", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [currentUser]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: "admin" | "manager" | "customer") => {
    if (!currentUser || currentUser.role !== "admin") {
      showToast("თქვენ არ გაქვთ ამ ოპერაციის შესრულების უფლება", "error");
      return;
    }

    // Prevent admin from changing their own role
    if (userId === currentUser.id) {
      showToast("თქვენი როლის შეცვლა არ შეგიძლიათ", "error");
      return;
    }

    try {
      setIsUpdatingRole(userId);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      const roleNames = {
        admin: "ადმინისტრატორი",
        manager: "მენეჯერი",
        customer: "მომხმარებელი"
      };

      showToast(`მომხმარებლის როლი წარმატებით შეიცვალა: ${roleNames[newRole]}`, "success");
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("როლის შეცვლა ვერ მოხერხდა", "error");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-red-100 text-red-800 border-red-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      customer: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const labels = {
      admin: "ადმინი",
      manager: "მენეჯერი",
      customer: "მომხმარებელი"
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  // Only admins can access this page
  if (currentUser?.role !== "admin") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          წვდომა შეზღუდულია
        </h3>
        <p className="text-gray-600">
          პარამეტრების მართვა მხოლოდ ადმინისტრატორისთვისაა ხელმისაწვდომი.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">მომხმარებლების ჩატვირთვა...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">პარამეტრები</h1>
            <p className="text-sm text-gray-600">
              მომხმარებლების მართვა და როლების მინიჭება
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">სულ მომხმარებელი</p>
                <p className="text-lg font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xs text-red-600">ადმინისტრატორები</p>
                <p className="text-lg font-bold text-red-900">
                  {users.filter(u => u.role === "admin").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">მენეჯერები</p>
                <p className="text-lg font-bold text-blue-900">
                  {users.filter(u => u.role === "manager").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">მომხმარებლები</p>
                <p className="text-lg font-bold text-gray-900">
                  {users.filter(u => u.role === "customer").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ძებნა ელფოსტით ან სახელით..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ყველა როლი</option>
              <option value="admin">ადმინისტრატორი</option>
              <option value="manager">მენეჯერი</option>
              <option value="customer">მომხმარებელი</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  მომხმარებელი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  როლი
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  რეგისტრაცია
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.displayName || "უსახელო"}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt instanceof Date
                      ? user.createdAt.toLocaleDateString("ka-GE")
                      : new Date(user.createdAt).toLocaleDateString("ka-GE")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.id === currentUser.id ? (
                      <span className="text-sm text-gray-400">მიმდინარე მომხმარებელი</span>
                    ) : (
                      <div className="flex space-x-2">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => updateUserRole(user.id, "admin")}
                            disabled={isUpdatingRole === user.id}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdatingRole === user.id ? "..." : "ადმინი"}
                          </button>
                        )}
                        {user.role !== "manager" && (
                          <button
                            onClick={() => updateUserRole(user.id, "manager")}
                            disabled={isUpdatingRole === user.id}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdatingRole === user.id ? "..." : "მენეჯერი"}
                          </button>
                        )}
                        {user.role !== "customer" && (
                          <button
                            onClick={() => updateUserRole(user.id, "customer")}
                            disabled={isUpdatingRole === user.id}
                            className="px-3 py-1 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdatingRole === user.id ? "..." : "მომხმარებელი"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterRole !== "all"
                ? "მოძებნილი კრიტერიუმით მომხმარებელი ვერ მოიძებნა"
                : "მომხმარებლები ვერ მოიძებნა"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametersPage;