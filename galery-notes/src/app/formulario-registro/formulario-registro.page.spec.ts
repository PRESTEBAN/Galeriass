import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioRegistroPage } from './formulario-registro.page';

describe('FormularioRegistroPage', () => {
  let component: FormularioRegistroPage;
  let fixture: ComponentFixture<FormularioRegistroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormularioRegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
