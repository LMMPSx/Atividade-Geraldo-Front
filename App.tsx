import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  FlatList, 
  Image, 
  Alert, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

const API_URL = 'http://192.168.0.109:3000';

type Place = {
  _id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
  createdAt?: string;
};

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/places`);
      const data = await res.json();
      setPlaces(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os registros');
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à localização.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o uso da câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        setPhoto(`data:image/jpeg;base64,${asset.base64}`);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (!title || !description || latitude == null || longitude == null) {
      Alert.alert('Atenção', 'Preencha título, descrição e capture a localização.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, latitude, longitude, photo }),
      });

      if (!res.ok) {
        Alert.alert('Erro', 'Falha ao salvar o registro.');
        return;
      }

      const created = await res.json();
      setPlaces((prev) => [created, ...prev]);
      
      // Limpar campos
      setTitle('');
      setDescription('');
      setLatitude(null);
      setLongitude(null);
      setPhoto(null);
      
      Alert.alert('Sucesso', 'Local salvo!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha na conexão com o backend.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Movemos todo o formulário para esta função (ou um componente separado)
  const renderHeader = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Novo Local</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Praia de Boa Viagem"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="O que torna este lugar especial?"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.buttonSecondary, latitude && styles.buttonSuccess]} 
          onPress={getLocation}
        >
          <MaterialIcons name="my-location" size={20} color={latitude ? "#fff" : "#4b5563"} />
          <Text style={[styles.buttonTextSecondary, latitude && styles.buttonTextWhite]}>
            {latitude ? 'Localização OK' : 'Pegar Local'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.buttonSecondary, photo && styles.buttonSuccess]} 
          onPress={takePhoto}
        >
          <MaterialIcons name="camera-alt" size={20} color={photo ? "#fff" : "#4b5563"} />
          <Text style={[styles.buttonTextSecondary, photo && styles.buttonTextWhite]}>
            {photo ? 'Foto OK' : 'Tirar Foto'}
          </Text>
        </TouchableOpacity>
      </View>

      {photo && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
              <MaterialIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.buttonPrimary, loading && styles.buttonDisabled]} 
        onPress={handleSave} 
        disabled={loading}
      >
        <Text style={styles.buttonTextPrimary}>
          {loading ? 'Salvando...' : 'Salvar Registro'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.dividerContainer}>
         <Text style={styles.sectionTitle}>Histórico</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Place }) => (
    <View style={styles.card}>
      {item.photo && <Image source={{ uri: item.photo }} style={styles.cardImage} />}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.cardFooter}>
          <View style={styles.coordsContainer}>
            <MaterialIcons name="location-on" size={16} color="#6366f1" />
            <Text style={styles.cardCoordsText}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          </View>
          {item.createdAt && (
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      {/* KeyboardAvoidingView ajuda o teclado a não cobrir o input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          
          {/* O Header do topo fica fixo fora da lista (opcional, se quiser que ele role junto, coloque dentro do renderHeader) */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meu Diário de Viagem</Text>
            <Text style={styles.headerSubtitle}>Registre seus momentos</Text>
          </View>

          {/* 2. Removemos o ScrollView e usamos apenas FlatList */}
          <FlatList
            data={places}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            // Aqui está a mágica: o formulário é o cabeçalho da lista
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  // Header fixo do App
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Estilos do Formulário (dentro da lista)
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  
  // Botões
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  buttonTextSecondary: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  buttonTextWhite: {
    color: '#fff',
  },
  buttonPrimary: {
    backgroundColor: '#4f46e5', 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Preview Foto
  previewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },

  // Lista e Títulos
  dividerContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingBottom: 40, 
    // O paddingHorizontal foi removido daqui porque o Header já tem padding 
    // e os cards precisam de margem. Ajuste abaixo:
  },
  
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 20, // Margem lateral adicionada ao card pois o container da lista não tem mais padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardCoordsText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});