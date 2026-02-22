import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const RUNS_COLLECTION = "runs";

export async function addRun(userId, run) {
  return addDoc(collection(db, RUNS_COLLECTION), {
    userId,
    date: run.date,
    distance: Number(run.distance),
    duration: run.duration || 0,
    notes: run.notes || "",
    isPlanRun: !!run.isPlanRun,
    planDate: run.planDate || null,
    createdAt: serverTimestamp(),
  });
}

export async function getRuns(userId) {
  const q = query(
    collection(db, RUNS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteRun(runId) {
  return deleteDoc(doc(db, RUNS_COLLECTION, runId));
}

export async function deleteRunByPlanDate(userId, planDate) {
  const q = query(
    collection(db, RUNS_COLLECTION),
    where("userId", "==", userId),
    where("planDate", "==", planDate)
  );
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  return Promise.all(deletePromises);
}
