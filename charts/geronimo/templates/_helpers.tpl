{{- define "geronimo.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "geronimo.fullname" -}}
{{- .Release.Name -}}
{{- end -}}

{{- define "geronimo.labels" -}}
app.kubernetes.io/name: {{ include "geronimo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "geronimo.componentLabels" -}}
{{ include "geronimo.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "geronimo.dbSecretName" -}}
{{- if .Values.dbSecret.externalName -}}
{{ .Values.dbSecret.externalName }}
{{- else -}}
{{ include "geronimo.fullname" . }}-db
{{- end -}}
{{- end -}}

{{- define "geronimo.reportsApiKeySecretName" -}}
{{- if .Values.reportsApiKeySecret.externalName -}}
{{ .Values.reportsApiKeySecret.externalName }}
{{- else -}}
{{ include "geronimo.fullname" . }}-reports-api-key
{{- end -}}
{{- end -}}

{{- define "geronimo.postgresHost" -}}
{{ include "geronimo.fullname" . }}-postgres
{{- end -}}

{{- define "geronimo.reportsBackendHost" -}}
{{ include "geronimo.fullname" . }}-reports-backend
{{- end -}}

{{- define "geronimo.reportsBackendEnv" -}}
- name: APP_ENV
  value: {{ .Values.reportsBackend.env.appEnv | quote }}
- name: APP_DEBUG
  value: {{ .Values.reportsBackend.env.appDebug | quote }}
- name: SERVER_PORT
  value: {{ .Values.reportsBackend.port | quote }}
- name: POSTGRES_HOST
  value: {{ include "geronimo.postgresHost" . | quote }}
- name: POSTGRES_SSLMODE
  {{- /* The bundled StatefulSet (postgres.enabled=true) runs the stock
  postgres image with SSL off -- "require" against it would just fail every
  connection. Only expect SSL once postgres.enabled=false, i.e. once you've
  pointed this at a real managed instance that terminates TLS. */}}
  value: {{ if .Values.postgres.enabled }}"disable"{{ else }}"require"{{ end }}
- name: MAIL_BACKEND
  value: {{ .Values.reportsBackend.env.mailBackend | quote }}
- name: APP_BASE_URL
  value: "http://{{ include "geronimo.fullname" . }}-reports-dashboard"
- name: CORS_ALLOWED_ORIGINS
  {{- $cors := .Values.reportsBackend.env.corsAllowedOrigins }}
  {{- if not $cors }}
    {{- if and .Values.reportsDashboard.ingress.enabled .Values.reportsDashboard.ingress.host }}
      {{- $cors = printf "https://%s" .Values.reportsDashboard.ingress.host }}
    {{- end }}
  {{- end }}
  value: {{ $cors | quote }}
- name: POSTGRES_USER
  valueFrom:
    secretKeyRef:
      name: {{ include "geronimo.dbSecretName" . }}
      key: POSTGRES_USER
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "geronimo.dbSecretName" . }}
      key: POSTGRES_PASSWORD
- name: POSTGRES_DB
  valueFrom:
    secretKeyRef:
      name: {{ include "geronimo.dbSecretName" . }}
      key: POSTGRES_DB
{{- end -}}
