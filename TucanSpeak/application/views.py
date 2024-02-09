from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse

import json

def main_page(request):
    return render(request, 'index.html')