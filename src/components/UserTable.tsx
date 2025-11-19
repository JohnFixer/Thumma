import React, { useState } from 'react';
import type { User, NewUserData } from '../types';
import { Role } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon } from './icons/HeroIcons';
import ConfirmationModal from './ConfirmationModal';
import EditUserModal from './EditUserModal';
import type { TranslationKey } from '../translations';

interface UserTableProps {
  users: User[];
  currentUser: User;
  onAddUserClick: () => void;
  onEditUser: (userId: string, data: NewUserData) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
}

const UserTable: React.FC<UserTableProps> = ({ users, currentUser, onAddUserClick, onEditUser, onDeleteUser, onResetPassword, showAlert, t }) => {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  
  const canWrite = currentUser.permissions?.user_management.write;
  const canDelete = currentUser.permissions?.user_management.delete;
  const canResetPassword = currentUser.permissions?.user_management.reset_password;

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-red-100 text-red-800';
      case Role.ACCOUNT_MANAGER:
        return 'bg-blue-100 text-blue-800';
      case Role.STORE_MANAGER:
        return 'bg-purple-100 text-purple-800';
      case Role.STORE_STAFF:
        return 'bg-green-100 text-green-800';
      case Role.POS_OPERATOR:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
        onDeleteUser(userToDelete.id);
        setUserToDelete(null);
    }
  };

  const handleEditSave = (userData: NewUserData) => {
    if (userToEdit) {
        onEditUser(userToEdit.id, userData);
        setUserToEdit(null); // Close modal on save
    }
  };

  const handleResetConfirm = () => {
    if (userToReset) {
        onResetPassword(userToReset.id);
        setUserToReset(null);
    }
  };

  return (
    <>
        <div className="bg-surface rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">{t('system_users')}</h3>
                {canWrite && (
                    <button 
                        onClick={onAddUserClick}
                        className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        {t('add_new_user')}
                    </button>
                )}
            </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                            <span>{user.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.role.map(role => (
                            <span key={role} className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)}`}>
                                {role}
                            </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            <button 
                                onClick={() => setUserToEdit(user)} 
                                disabled={!canWrite}
                                className="text-primary hover:text-blue-700 p-1 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => setUserToReset(user)} 
                                disabled={!canResetPassword || currentUser.id === user.id}
                                className="text-yellow-600 hover:text-yellow-800 p-1 disabled:text-gray-300 disabled:cursor-not-allowed"
                                title={t('reset_password')}
                            >
                                <KeyIcon className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => setUserToDelete(user)} 
                                disabled={!canDelete || currentUser.id === user.id}
                                className="text-red-600 hover:text-red-800 p-1 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
        
        {userToEdit && (
             <EditUserModal
                isOpen={!!userToEdit}
                onClose={() => setUserToEdit(null)}
                onEditUser={handleEditSave}
                user={userToEdit}
                showAlert={showAlert}
                t={t}
            />
        )}
        {userToDelete && (
             <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={t('delete_user_title')}
                message={t('delete_user_confirm_message', { userName: userToDelete.name })}
                t={t}
            />
        )}
        {userToReset && (
             <ConfirmationModal
                isOpen={!!userToReset}
                onClose={() => setUserToReset(null)}
                onConfirm={handleResetConfirm}
                title={t('reset_password_confirm_title')}
                message={t('reset_password_confirm_message', { userName: userToReset.name })}
                confirmText={t('reset_password')}
                confirmButtonClass="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                t={t}
            />
        )}
    </>
  );
};

export default UserTable;
