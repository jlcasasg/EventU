import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { AngularFireDatabase  } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { ConfigProvider } from '../config/config'

@Injectable()
export class FirebaseProvider {

  user: any = [];

  constructor(public http: Http, public fireDB: AngularFireDatabase,
              public fireAuth: AngularFireAuth, public configPro: ConfigProvider) {
    console.log('Hello FirebaseProvider Provider');
  }

  //Validate Session
  validateSession(){
    return new Promise( (resolve,reject) =>{
      this.fireAuth.authState.subscribe( user =>{
        console.log("sesion");
        if(user){
          this.user = user;
          resolve(user);
        }
        else reject(user);
      })
    })
  }

  //Authentication
  login(email, password){
    return new Promise((resolve,reject) => {
      this.fireAuth.auth.signInWithEmailAndPassword(email,password).then(
        (data) => {
          this.user = data;
          if(this.user.emailVerified) resolve(data);
          else this.configPro.presentToast("Debes Validar tu correo primero");
        }
    ).catch((error) => {
      console.log(error);
      if(error.code == "auth/network-request-failed"){
        this.configPro.presentToast("Verifica tu conexión a internet");
      }
      else this.configPro.presentToast("Correo y/o contraseña incorrectos");
      reject(error);
      });
    });
  }

  singUp(email,password){
    return new Promise((resolve,reject) => {
      this.fireAuth.auth.createUserWithEmailAndPassword(email,password).then(
        (data) => {
          this.fireAuth.auth.onAuthStateChanged(user => {
            user.sendEmailVerification(); 
          })
          resolve(data);
        }
    ).catch((error) => {
        let err: any = [];
        err = error;
        console.log(error);
        if(err.code == "auth/email-already-in-use")
          this.configPro.presentToast("El correo ya se encuentra registrado, por favor valida tu correo")
      });
    });
  }

  logout(){
    return new Promise((resolve,reject) => {
      this.fireAuth.auth.signOut().then( data => {
        this.configPro.dismissLoading()
        resolve(data)
      })
      .catch( error => {
        console.log(error);
        this.configPro.presentToast("No se ha podido cerrar sesión")
      });
    })
  }

  //Events
  getEvents() {
      return new Promise((resolve, reject) => {
          this.fireDB.list('/events/').valueChanges().subscribe( data =>{
            console.log(data);
            if(data) resolve(data);
            else console.log(data);
          })
      });
  }

  getEventsById() {
    return new Promise((resolve,reject) =>{
      let events = [];
      var ref = this.fireDB.database.ref('events').orderByChild("user");
      ref.equalTo(this.user.uid).once("value", data => {
        data.forEach( a => {
          let event = a.val();
          event.id = a.key;
          events.push(event);
          return false;
        });
      }).then( data => resolve(events))
    })

  }
 
  addEvent(event) {
    event.user = this.user.uid;
    return new Promise( (resolve, reject) => {
      this.fireDB.list('/events/').push(event).then(
        (data) => {
          this.configPro.presentToast("El evento se ha creado con exito");
          resolve(data);
        }
      )
    });
  }
 
  removeEvent(id) {
    this.fireDB.list('/events/').remove(id);
  }

  getEventByName(event) {
      let events = [];
      return new Promise((resolve, reject) => {
          var ref = this.fireDB.database.ref('events').orderByKey();
          ref.equalTo(event).once("value", data => {
              data.forEach(a => {
                let event = a.val();
                event.id = a.key;
                events.push(event);
                return false;
              });
          }).then(data => resolve(events))
      });
  }

  getEventsByDates(startDate: Date, endDate: Date) {
      console.log(startDate.toISOString(), endDate.toISOString());
      return new Promise((resolve, reject) => {
          let events = [];
          var ref = this.fireDB.database.ref('events').orderByChild("date");
          ref.startAt(startDate.toISOString()).endAt(endDate.toISOString()).once("value", data => {
              console.log(data);
              data.forEach(a => {
                let event = a.val();
                event.id = a.key;
                events.push(event);
                return false;
              });
          }).then(data => resolve(events))
      });
  }

  getEventsByDate(date: Date) {
      return new Promise((resolve, reject) => {
          let events = [];
          var ref = this.fireDB.database.ref('events').orderByChild("date");
          ref.startAt(date.toISOString()).once("value", data => {
              console.log(data);
              data.forEach(a => {
                  let event = a.val();
                  event.id = a.key;
                  events.push(event);
                  return false;
              });
          }).then(data => resolve(events))
      });
  }

}
