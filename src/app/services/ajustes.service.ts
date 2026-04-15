import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Ajustes {
  iva: number;
}

const DOC_PATH = 'configuracion/global';
const DEFAULTS: Ajustes = { iva: 21 };

@Injectable({ providedIn: 'root' })
export class AjustesService {
  private firestore = inject(Firestore);

  obtenerAjustes(): Observable<Ajustes> {
    const docRef = doc(this.firestore, DOC_PATH);
    return from(getDoc(docRef)).pipe(
      map(snap => (snap.exists() ? (snap.data() as Ajustes) : DEFAULTS)),
      catchError(() => of(DEFAULTS))
    );
  }

  guardarAjustes(ajustes: Ajustes): Promise<void> {
    const docRef = doc(this.firestore, DOC_PATH);
    return setDoc(docRef, ajustes);
  }
}
