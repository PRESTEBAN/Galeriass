import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormularioRegistroPage } from './formulario-registro.page';

const routes: Routes = [
  {
    path: '',
    component: FormularioRegistroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormularioRegistroPageRoutingModule {}
