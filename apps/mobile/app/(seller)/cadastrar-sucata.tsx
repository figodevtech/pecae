import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, BackHandler, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { useVehicleWizardStore } from '../../src/store/vehicle-wizard-store';
import { api } from '../../src/services/api';

// Steps
import { Step1VehicleSelection } from '../../src/components/VehicleWizard/Step1VehicleSelection';
import { Step2TechDetails } from '../../src/components/VehicleWizard/Step2TechDetails';
import { Step3Photos } from '../../src/components/VehicleWizard/Step3Photos';
import { Step4Inventory } from '../../src/components/VehicleWizard/Step4Inventory';
import { Step5Review } from '../../src/components/VehicleWizard/Step5Review';

const stepsInfo = [
  { step: 1, name: 'Veículo' },
  { step: 2, name: 'Detalhes' },
  { step: 3, name: 'Fotos' },
  { step: 4, name: 'Inventário' },
  { step: 5, name: 'Revisão' },
];

export default function CadastrarSucataScreen() {
  const { colors, typography } = usePecaeTheme();
  const { currentStep, setStep, data, resetWizard, loadVehicle, isStepValid } = useVehicleWizardStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);

  const handleClose = useCallback(() => {
    Alert.alert(
      "Sair do Cadastro",
      "As informações não salvas serão perdidas. Deseja sair?",
      [
        { text: "Continuar Editando", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: () => {
            resetWizard();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(seller)/(seller-tabs)');
            }
          }
        }
      ]
    );
  }, [router, resetWizard]);

  // Handle Android Back Button
  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [handleClose]);

  // Load vehicle data if editing
  useEffect(() => {
    if (id) {
      const fetchVehicle = async () => {
        setIsLoadingVehicle(true);
        try {
          const { data: vehicleData } = await api.get(`/vehicles/${id}`);
          loadVehicle(vehicleData);
        } catch (error: any) {
          console.error("Erro ao carregar veículo para edição:", error);
          Alert.alert(
            "Erro de Carregamento", 
            "Não foi possível carregar as informações do veículo para edição.",
            [{ text: "Voltar", onPress: () => router.back() }]
          );
        } finally {
          setIsLoadingVehicle(false);
        }
      };
      fetchVehicle();
    } else {
      resetWizard();
    }
  }, [id]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1VehicleSelection />;
      case 2:
        return <Step2TechDetails />;
      case 3:
        return <Step3Photos />;
      case 4:
        return <Step4Inventory />;
      case 5:
        return <Step5Review />;
      default:
        return <Step1VehicleSelection />;
    }
  };

  if (isLoadingVehicle) {
    return (
      <PecaeBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.loadingText, { color: colors.textMuted, fontFamily: typography.body }]}>
            Carregando informações do veículo na Forja...
          </Text>
        </View>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: data.editingId ? 'FORJA: EDIÇÃO DE ANÚNCIO' : 'FORJA: NOVO ANÚNCIO',
          headerTitleStyle: { 
            fontFamily: typography.display, 
            fontSize: 12, 
            letterSpacing: 3,
            color: colors.brand 
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.headerBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          )
        }} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Barra de Progresso do Wizard */}
          <View style={styles.progressBarContainer}>
            <PecaeGlassCard intensity={15} style={styles.progressBarCard}>
              <View style={styles.stepsRow}>
                {stepsInfo.map((item, index) => {
                  const isCompleted = currentStep > item.step;
                  const isActive = currentStep === item.step;
                  
                  return (
                    <React.Fragment key={item.step}>
                      {/* Step Circle */}
                      <View style={styles.stepCircleWrapper}>
                        <TouchableOpacity
                          disabled={item.step > currentStep} // Não permite pular para passos futuros
                          onPress={() => setStep(item.step)}
                          style={[
                            styles.stepCircle,
                            {
                              backgroundColor: isActive 
                                ? colors.brand 
                                : isCompleted 
                                  ? 'rgba(63, 255, 139, 0.2)' 
                                  : 'rgba(255, 255, 255, 0.03)',
                              borderColor: isActive 
                                ? colors.brand 
                                : isCompleted 
                                  ? colors.brand 
                                  : 'rgba(255, 255, 255, 0.1)',
                            }
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={14} color={colors.isDark ? '#000' : '#fff'} />
                          ) : (
                            <Text style={[
                              styles.stepNumber, 
                              { 
                                color: isActive 
                                  ? '#000' 
                                  : colors.textMuted,
                                fontFamily: typography.bold
                              }
                            ]}>
                              {item.step}
                            </Text>
                          )}
                        </TouchableOpacity>
                        <Text style={[
                          styles.stepLabel,
                          {
                            color: isActive ? colors.brand : colors.textMuted,
                            fontFamily: isActive ? typography.bold : typography.body,
                          }
                        ]}>
                          {item.name}
                        </Text>
                      </View>

                      {/* Connecting Line */}
                      {index < stepsInfo.length - 1 && (
                        <View style={[
                          styles.connectingLine,
                          {
                            backgroundColor: currentStep > item.step 
                              ? colors.brand 
                              : 'rgba(255, 255, 255, 0.05)',
                          }
                        ]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </PecaeGlassCard>
          </View>

          {/* Conteúdo Dinâmico do Passo Atual */}
          <View style={styles.stepContent}>
            {renderStep()}
          </View>
        </View>
      </KeyboardAvoidingView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  headerBtn: {
    padding: 8,
    zIndex: 10,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 100,
    marginBottom: 10,
  },
  progressBarCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCircleWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 11,
  },
  stepLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  connectingLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 14,
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
  },
});
