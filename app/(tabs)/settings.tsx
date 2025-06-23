import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Shield,
  Database,
  Heart,
  Moon,
  Volume2,
  Smartphone,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { 
  registerForPushNotificationsAsync,
  scheduleHealthReminders,
  getScheduledNotifications,
  type NotificationPreferences 
} from '@/lib/notifications';
import { 
  saveResearchPreferences,
  getResearchPreferences,
  type ResearchPreferences 
} from '@/lib/research';
import { 
  getCurrentLanguage,
  setLanguage,
  getAvailableLanguages,
  t,
  type Language 
} from '@/lib/i18n';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLanguage());
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    medication: true,
    hydration: true,
    exercise: true,
    meals: true,
    checkups: true,
    motivational: true,
  });

  // Research preferences
  const [researchPrefs, setResearchPrefs] = useState<ResearchPreferences>({
    participateInResearch: false,
    allowAnonymousDataExport: false,
    allowTrendAnalysis: false,
    allowPublicHealthReporting: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load notification token
      const token = await registerForPushNotificationsAsync();
      setPushToken(token);

      // Load research preferences
      if (user) {
        const preferences = await getResearchPreferences(user.id);
        if (preferences) {
          setResearchPrefs(preferences);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async (newPrefs: NotificationPreferences) => {
    try {
      setNotificationPrefs(newPrefs);
      await scheduleHealthReminders(newPrefs);
      
      const scheduledCount = (await getScheduledNotifications()).length;
      Alert.alert(
        'Notifications Updated',
        `${scheduledCount} reminders have been scheduled based on your preferences.`
      );
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const updateResearchPreferences = async (newPrefs: ResearchPreferences) => {
    if (!user) return;

    try {
      setResearchPrefs(newPrefs);
      await saveResearchPreferences(user.id, newPrefs);
      Alert.alert('Success', 'Research preferences updated successfully');
    } catch (error) {
      console.error('Error updating research preferences:', error);
      Alert.alert('Error', 'Failed to update research preferences');
    }
  };

  const changeLanguage = (language: Language) => {
    setLanguage(language);
    setCurrentLanguage(language);
    Alert.alert('Language Changed', `Language has been changed to ${language === 'en' ? 'English' : 'Kinyarwanda'}`);
  };

  const showDataPrivacyInfo = () => {
    Alert.alert(
      'Data Privacy',
      'Your health data is protected according to Rwanda\'s Law No. 058/2021 on the protection of personal data and privacy. We use industry-standard encryption and never share identifiable information without your explicit consent.',
      [{ text: 'OK' }]
    );
  };

  const showResearchInfo = () => {
    Alert.alert(
      'Research Participation',
      'By participating in research, you help improve diabetes prevention in Rwanda. All data is anonymized and aggregated. You can opt out at any time.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SettingsIcon size={24} color="#0066CC" />
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Medication Reminders</Text>
                <Text style={styles.settingDescription}>
                  Daily reminders to take your medication
                </Text>
              </View>
              <Switch
                value={notificationPrefs.medication}
                onValueChange={(value) =>
                  updateNotificationPreferences({ ...notificationPrefs, medication: value })
                }
                trackColor={{ false: '#E2E8F0', true: '#0066CC' }}
                thumbColor="white"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hydration Reminders</Text>
                <Text style={styles.settingDescription}>
                  Regular reminders to stay hydrated
                </Text>
              </View>
              <Switch
                value={notificationPrefs.hydration}
                onValueChange={(value) =>
                  updateNotificationPreferences({ ...notificationPrefs, hydration: value })
                }
                trackColor={{ false: '#E2E8F0', true: '#0066CC' }}
                thumbColor="white"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Exercise Reminders</Text>
                <Text style={styles.settingDescription}>
                  Daily motivation to stay active
                </Text>
              </View>
              <Switch
                value={notificationPrefs.exercise}
                onValueChange={(value) =>
                  updateNotificationPreferences({ ...notificationPrefs, exercise: value })
                }
                trackColor={{ false: '#E2E8F0', true: '#0066CC' }}
                thumbColor="white"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Meal Reminders</Text>
                <Text style={styles.settingDescription}>
                  Reminders for healthy meal times
                </Text>
              </View>
              <Switch
                value={notificationPrefs.meals}
                onValueChange={(value) =>
                  updateNotificationPreferences({ ...notificationPrefs, meals: value })
                }
                trackColor={{ false: '#E2E8F0', true: '#0066CC' }}
                thumbColor="white"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Motivational Messages</Text>
                <Text style={styles.settingDescription}>
                  Weekly encouragement and tips
                </Text>
              </View>
              <Switch
                value={notificationPrefs.motivational}
                onValueChange={(value) =>
                  updateNotificationPreferences({ ...notificationPrefs, motivational: value })
                }
                trackColor={{ false: '#E2E8F0', true: '#0066CC' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Language / Ururimi</Text>
          </View>

          <View style={styles.settingCard}>
            {getAvailableLanguages().map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.languageOption}
                onPress={() => changeLanguage(language.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.nativeName}</Text>
                </View>
                {currentLanguage === language.code && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Research & Public Health Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Research & Public Health</Text>
            <TouchableOpacity onPress={showResearchInfo}>
              <Text style={styles.infoButton}>ℹ️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Participate in Research</Text>
                <Text style={styles.settingDescription}>
                  Help improve diabetes prevention in Rwanda
                </Text>
              </View>
              <Switch
                value={researchPrefs.participateInResearch}
                onValueChange={(value) =>
                  updateResearchPreferences({ ...researchPrefs, participateInResearch: value })
                }
                trackColor={{ false: '#E2E8F0', true: '#28A745' }}
                thumbColor="white"
              />
            </View>

            {researchPrefs.participateInResearch && (
              <>
                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Anonymous Data Export</Text>
                    <Text style={styles.settingDescription}>
                      Allow anonymized health data for research
                    </Text>
                  </View>
                  <Switch
                    value={researchPrefs.allowAnonymousDataExport}
                    onValueChange={(value) =>
                      updateResearchPreferences({ ...researchPrefs, allowAnonymousDataExport: value })
                    }
                    trackColor={{ false: '#E2E8F0', true: '#28A745' }}
                    thumbColor="white"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Trend Analysis</Text>
                    <Text style={styles.settingDescription}>
                      Include data in population health trends
                    </Text>
                  </View>
                  <Switch
                    value={researchPrefs.allowTrendAnalysis}
                    onValueChange={(value) =>
                      updateResearchPreferences({ ...researchPrefs, allowTrendAnalysis: value })
                    }
                    trackColor={{ false: '#E2E8F0', true: '#28A745' }}
                    thumbColor="white"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Public Health Reporting</Text>
                    <Text style={styles.settingDescription}>
                      Support national health initiatives
                    </Text>
                  </View>
                  <Switch
                    value={researchPrefs.allowPublicHealthReporting}
                    onValueChange={(value) =>
                      updateResearchPreferences({ ...researchPrefs, allowPublicHealthReporting: value })
                    }
                    trackColor={{ false: '#E2E8F0', true: '#28A745' }}
                    thumbColor="white"
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#0066CC" />
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
          </View>

          <TouchableOpacity style={styles.settingCard} onPress={showDataPrivacyInfo}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Data Privacy Policy</Text>
                <Text style={styles.settingDescription}>
                  Learn how we protect your data
                </Text>
              </View>
              <ChevronRight size={20} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Device Info Section */}
        {pushToken && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Smartphone size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Device Information</Text>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    {pushToken ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: pushToken ? '#28A745' : '#DC3545' }
                ]} />
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>GlucoGard AI v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Built with ❤️ for Rwanda's health
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  infoButton: {
    fontSize: 16,
    color: '#64748B',
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
});