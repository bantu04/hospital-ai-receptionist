import { db } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

export class FirestoreService {
  static async getPatientByPhone(phoneNumber) {
    try {
      const clean = phoneNumber.replace(/\D/g, '');
      const patientsRef = db.collection('patients');

      const snapshot = await patientsRef
        .where('phoneNumbers', 'array-contains', clean)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('👤 No patient with phone:', clean);
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error('❌ getPatientByPhone error:', err);
      throw err;
    }
  }

  static async createPatient(patientData) {
    const now = Timestamp.now();
    const docRef = await db.collection('patients').add({
      ...patientData,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...patientData };
  }

  static async createAppointment(appointmentData) {
    const now = Timestamp.now();
    const appointment = {
      ...appointmentData,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now
    };
    const docRef = await db.collection('appointments').add(appointment);
    return { id: docRef.id, ...appointment };
  }

  static async getPatientAppointments(patientId) {
    const snapshot = await db
      .collection('appointments')
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async logCall(callData) {
    try {
      const log = { ...callData, timestamp: Timestamp.now() };
      await db.collection('callLogs').add(log);
      console.log('📞 Call logged:', log.callId || 'unknown');
      return log;
    } catch (err) {
      console.error('❌ logCall error:', err);
      throw err;
    }
  }

  static async logSymptomMapping(symptom, department, success = true) {
    try {
      const log = {
        symptom,
        department,
        success,
        timestamp: Timestamp.now()
      };
      await db.collection('symptomMappings').add(log);
      console.log('📊 Symptom mapping logged:', symptom, '->', department);
    } catch (err) {
      console.error('❌ logSymptomMapping error:', err);
    }
  }
}

export default FirestoreService;