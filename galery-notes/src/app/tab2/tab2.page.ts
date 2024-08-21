import { Component } from '@angular/core';
import { UserServiceService } from '../services/user-service.service';
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  userName: string = '';

  constructor(private userService: UserServiceService) {}
    
  ngOnInit(): void {
    this.loadUserName();
  }

  async loadUserName() {
    try {
      this.userName = await this.userService.getUserName();
    } catch (error) {
      console.error('Error al obtener el nombre del usuario:', error);
    }
  }
  

}
