def create_report_excel(report, location):
    workbook = xlsxwriter.Workbook(location)
    for result_id, result_data in report.items():
        for key in result_data['categories'].keys():
            sheetname = f"{result_id}_{key}".replace(':', '').replace(' ', '').replace('BIOS', '').replace('/', '').replace('?', '').replace('\\', '|')
            if len(sheetname) > 30:
                start = len(sheetname) - 30
            else:
                start = 0
            worksheet = workbook.add_worksheet(sheetname[start:])
            worksheet.set_column('A:Z', 25)
            bold = workbook.add_format({'bold': True})
            worksheet.write('A1', key, bold)

            row_num = 0
            for i in range(len(result_data['categories'][key])):
                dic = result_data['categories'][key][i]
                col_num = 0
                row_num += 1
                for k, value in dic.items():
                    worksheet.write(0, col_num, k, bold)
                    worksheet.write(row_num, col_num, value)
                    col_num += 1
    workbook.close()




from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
import xlsxwriter
import os
from django.http import HttpResponse
from wsgiref.util import FileWrapper
from myapp.models import Result  # Update with your actual models

class FileDownloadListAPIView(generics.ListAPIView):
    def post(self, request, *args, **kwargs):
        result_ids = request.data.get('result_ids', [])
        report = {}

        for result_id in result_ids:
            result = Result.objects.get(id=result_id)
            categories = Result.Category.objects.filter(result=result).order_by('order')
            rows = Result.Row.objects.filter(category__in=categories).order_by('order')
            fields = Result.Field.objects.filter(row__in=rows)

            result_data = {}
            result_data['tool_name'] = result.module.tool.name
            result_data['hostname'] = result.hostname
            result_data['module_name'] = result.module.name
            result_data['module_id'] = result.module.id
            result_data['categories'] = {}

            for category in categories:
                rows = Result.Row.objects.filter(category=category).order_by('order')
                rows_list = []
                for row in rows:
                    fields = Result.Field.objects.filter(row=row).order_by('order')
                    fields_list = {}
                    for field in fields:
                        fields_list[field.attribute_slug] = field.value
                    rows_list.append(fields_list)
                result_data['categories'][category.name_slug] = rows_list

            report[result_id] = result_data

        location = os.path.join(BASE_DIR, "temp", "ExcelInventoryReport.xlsx")
        create_report_excel(report, location)
        document = open(location, 'rb')
        response = HttpResponse(FileWrapper(document), content_type='application/msword')
        response['Content-Disposition'] = 'attachment; filename="ExcelInventoryReport.xlsx"'
        return response
