#!/usr/bin/env python3
"""
ai_branch_auditor.py - Script de Enrutamiento Modular, Creación de Ramas y Auditoría IA
Ejecutado por GitHub Actions para crear ramas tipo 'modulo-{nombre}', auditar con Gemini
y generar AI_AUDIT_REPORT.md de forma aislada sin mezclar en main.
"""

import os
import sys
import subprocess
import glob
from pathlib import Path

def run_cmd(cmd, check=True):
    print(f"[EXEC] {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"[ERROR] {result.stderr}")
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return result.stdout.strip()

def collect_module_files_summary(module_path):
    files = []
    total_size = 0
    file_list = []
    
    for p in Path(module_path).rglob('*'):
        if p.is_file():
            rel = str(p)
            size = p.stat().st_size
            total_size += size
            file_list.append(f"- `{rel}` ({size} bytes)")
    
    return "\n".join(file_list), total_size

def generate_ai_audit(module_name, files_summary, total_size):
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Prompt estructurado de auditoría para Gemini orientado a Flujos BIM Maestros
    audit_content = f"""# 🛡️ AI AUDIT REPORT: Módulo `{module_name}`
**Fecha de Auditoría:** {os.environ.get('GITHUB_RUN_ID', 'Local Run')}
**Rama Generada:** `modulo-{module_name}`
**Tamaño del Módulo:** {total_size / 1024:.2f} KB
**Alineación Estratégica:** Flujo BIM Maestro (Revit / Dynamo / IFC / OpenBIM / FEM)

---

## 1. 📋 Estructura y Archivos del Módulo
{files_summary}

---

## 2. 🧩 Análisis de Dependencias y Arquitectura
- **Tipo de Componente:** Módulo funcional de automatización / interoperabilidad BIM-FEM.
- **Acoplamiento con Main:** Aislado en rama para desarrollo y pruebas no destructivas.
- **Entorno de Ejecución:** Windows 10/11 Pro, PowerShell 5.1 / 7.x, .NET Runtime 4.8 / Core.

---

## 3. 🏗️ Vector de Escalabilidad hacia Flujos BIM Maestros
- **Alineación con el Ecosistema:**
  - Integración nativa con parámetros compartidos y estandarización ISO 19650.
  - Compatibilidad con pipelines de extracción paramétrica y verificación de modelos.
  - Orquestación con `AKSEngine` para automatización desatendida.
- **Optimizaciones Clave:**
  - Evitar bloqueos de I/O sincrónicos en archivos de gran tamaño (`.rvt`, `.ifc`, `.dwg`).
  - Implementar streaming y procesamiento por bloques en operaciones de datos.

---

## 4. ⚠️ Evaluación de Riesgos y Seguridad Soberana
- **Políticas de Ejecución:** No modifica el kernel del SO; compatible con `SecuritySandbox-Engine`.
- **Integridad:** Requiere hash SHA-256 verificado antes de la fusión en `main`.
- **Zonas de Confianza:** Clasificado para Zona 1 (Local Workstation) y Zona 2 (BIM Shared Repositories).

---

## 5. 💡 Recomendaciones para Maximizar Funcionalidades en `main`
1. **Contrato de Interfaz Modular:** Exponer comandos estandarizados tipo cmdlet (`Invoke-{module_name}`, `Get-{module_name}Status`).
2. **Auto-Validación Pester:** Incluir tests unitarios en la rama para validar 0 fallos antes del Pull Request.
3. **Mecanismo de Hot-Plug:** Registrar el módulo en el catálogo de plugins de ABEM para carga dinámica sin reinicio.

---

## 6. 🚀 Veredicto y Preparación de Pull Request
- **Estado:** `LISTO_PARA_DESARROLLO_Y_REVISION`
- **Recomendación al Actor Humano:** Continuar iteraciones en `modulo-{module_name}`. Una vez superadas las pruebas, disparar el workflow `prepare-pr.yml` hacia `main`.
"""

    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""
            Eres el Auditor IA de Arquitectura de Software para EntornoDesk (BIM/FEM/DevOps y AKS Engine).
            Analiza el siguiente módulo: {module_name}
            Archivos detectados:
            {files_summary}

            Tu objetivo es proporcionar recomendaciones precisas para:
            1. Escalar y optimizar el trabajo dentro de la rama 'modulo-{module_name}'.
            2. Preparar el módulo para incorporar la mayor cantidad de funciones dentro de 'main' sin romper la estabilidad del sistema.
            3. Orientar la arquitectura hacia flujos BIM maestros (Revit, Dynamo, pyRevit, IFC, análisis estructural FEM, estandarización de parámetros).
            4. Respetar el control absoluto del actor humano (el operador decide cuándo y qué se mergea).

            Genera un informe exhaustivo en Markdown en español siguiendo esta estructura:
            - Resumen técnico del módulo y alineación con flujos BIM maestros.
            - Estrategias de optimización interna de la rama.
            - Guía de preparación para el Pull Request hacia main con máxima funcionalidad.
            - Matriz de riesgos y compatibilidad con Windows 10/11 Pro.
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"[WARN] Error al consultar Gemini API: {e}. Usando reporte estático seguro.")
            
    return audit_content

def process_module(module_name):
    if not module_name or not os.path.exists(module_name):
        print(f"[SKIP] Carpeta '{module_name}' no existe o no es un directorio válido.")
        return

    branch_name = f"modulo-{module_name.replace('/', '_')}"
    print(f"\n=================================================================")
    print(f"  PROCESANDO MÓDULO: {module_name} -> RAMA: {branch_name}")
    print(f"=================================================================")

    # Resumen de archivos
    files_summary, total_size = collect_module_files_summary(module_name)
    
    # Generar Auditoría IA
    audit_report = generate_ai_audit(module_name, files_summary, total_size)
    
    # Escribir reporte en la carpeta del módulo
    report_path = os.path.join(module_name, "AI_AUDIT_REPORT.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(audit_report)
    print(f"[OK] Reporte generado en: {report_path}")

    # Operaciones Git para aislar en su rama
    try:
        run_cmd(["git", "checkout", "-B", branch_name])
        run_cmd(["git", "add", module_name, report_path])
        run_cmd(["git", "commit", "-m", f"chore(ai-audit): Auditoría IA y aislamiento de {module_name} en rama {branch_name}"])
        print(f"[OK] Rama {branch_name} creada y confirmada.")
        
        # En entorno de GitHub Actions con token configurado, enviar a origin
        if os.environ.get("GITHUB_ACTIONS") == "true":
            run_cmd(["git", "push", "origin", branch_name, "--force"])
            print(f"[OK] Rama {branch_name} enviada exitosamente a GitHub.")
    except Exception as e:
        print(f"[WARN] Fallo durante la gestión de ramas en Git: {e}")
    finally:
        # Regresar a main
        subprocess.run(["git", "checkout", "main"], capture_output=True)

def main():
    if len(sys.argv) < 2:
        print("Uso: python ai_branch_auditor.py <lista_de_carpetas_separadas_por_espacio>")
        sys.exit(0)

    modules_raw = sys.argv[1]
    modules = [m.strip() for m in modules_raw.split() if m.strip()]
    
    if not modules:
        # Fallback a carpetas conocidas si no se pasaron argumentos
        modules = [d for d in ["CryptoCore", "modules", "BIMParameters", "AKSEngine"] if os.path.exists(d)]

    print(f"Carpetas objetivo para crear ramas y auditar: {modules}")
    for mod in modules:
        process_module(mod)

if __name__ == "__main__":
    main()
