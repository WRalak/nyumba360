import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TenantProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const { user, updateProfile } = useAuth();

  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        email: user.email || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^07[0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Valid Kenyan phone number required (07XXXXXXXX)';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Logout logic would be handled by AuthContext
            console.log('Logout');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        email: user.email || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
    setEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {formData.first_name?.[0]?.toUpperCase()}{formData.last_name?.[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {editing ? (
              <TextInput
                style={styles.profileNameInput}
                value={`${formData.first_name} ${formData.last_name}`}
                onChangeText={(text) => handleChange('first_name', text.split(' ')[0])}
                autoFocus
              />
            ) : (
              <>
                <Text style={styles.profileName}>
                  {formData.first_name} {formData.last_name}
                </Text>
                <Text style={styles.profileType}>Tenant</Text>
              </>
            )}
            <Text style={styles.profilePhone}>{formData.phone}</Text>
            {formData.email && (
              <Text style={styles.profileEmail}>{formData.email}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Icon
              name={editing ? 'close' : 'edit'}
              size={20}
              color={editing ? '#ef4444' : '#2563eb'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        {editing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, errors.first_name && styles.inputError]}
                value={formData.first_name}
                onChangeText={(text) => handleChange('first_name', text)}
                placeholder="John"
                autoCapitalize="words"
              />
              {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, errors.last_name && styles.inputError]}
                value={formData.last_name}
                onChangeText={(text) => handleChange('last_name', text)}
                placeholder="Doe"
                autoCapitalize="words"
              />
              {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                placeholder="0712345678"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Contact Name</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_name}
                onChangeText={(text) => handleChange('emergency_contact_name', text)}
                placeholder="Emergency contact person"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.emergency_contact_phone}
                onChangeText={(text) => handleChange('emergency_contact_phone', text)}
                placeholder="0712345678"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>First Name</Text>
              <Text style={styles.infoValue}>{formData.first_name}</Text>
            </View>

            <View style={styles.infoGroup}>
              <   Text style={styles.infoLabel}>Last Name</Text>
              <Text style={styles.infoValue}>{formData.last_name}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {formData.email || 'Not provided'}
              </Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{formData.phone}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>
                {formData.emergency_contact_name || 'Not provided'}
              </Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Emergency Phone</Text>
              <Text style={styles.infoValue}>
                {formData.emergency_contact_phone || 'Not provided'}
              </Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoValue}>Tenant</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          </>
        )}

        {!editing && (
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}>
              <Icon name="notifications" size={24} color="#6b7280" />
              <Text style={styles.settingsText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}>
              <Icon name="security" size={24} color="#6b7280" />
              <Text style={styles.settingsText}>Security</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('Coming Soon', 'Help & support will be available soon')}>
              <Icon name="help" size={24} color="#6b7280" />
              <Text style={styles.settingsText}>Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('About', 'Nyumba360 v1.0.0\nProperty Management Platform for Kenya')}>
              <Icon name="info" size={24} color="#6b7280" />
              <Text style={styles.settingsText}>About</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#dbeafe',
  },
  profileNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: 4,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  infoGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    gap: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingsText: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TenantProfileScreen;
